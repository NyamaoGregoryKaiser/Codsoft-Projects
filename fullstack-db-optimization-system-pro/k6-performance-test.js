```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Configuration for the test
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },   // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.01'],                 // Less than 1% of requests should fail
  },
};

// Test data for user credentials
const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json')).users;
});

// A user.json file might look like:
// {
//   "users": [
//     { "email": "user1@example.com", "password": "password123" },
//     { "email": "user2@example.com", "password": "password123" }
//   ]
// }

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';
const adminEmail = 'admin@example.com'; // Use a known admin user for setup
const adminPassword = 'adminpassword';

let AUTH_TOKENS = {}; // Store JWT tokens for users
let DB_IDS = {};     // Store created database IDs

// Setup function to run once before all VUs
export function setup() {
  console.log('--- K6 Setup Started ---');

  // Register an admin user if not exists and get token
  let adminRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    username: 'admin_perf_test',
    email: adminEmail,
    password: adminPassword,
    role: 'admin'
  }), { headers: { 'Content-Type': 'application/json' } });

  let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: adminEmail,
    password: adminPassword
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, {
    'admin login successful': (r) => r.status === 200,
    'admin token received': (r) => r.json() && r.json().token !== ''
  });

  AUTH_TOKENS['admin'] = loginRes.json('token');

  // Register and login all test users to get their tokens
  for (const user of users) {
    http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      username: user.email.split('@')[0],
      email: user.email,
      password: user.password
    }), { headers: { 'Content-Type': 'application/json' } });

    let userLoginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password
    }), { headers: { 'Content-Type': 'application/json' } });

    check(userLoginRes, {
      [`${user.email} login successful`]: (r) => r.status === 200,
      [`${user.email} token received`]: (r) => r.json() && r.json().token !== ''
    });
    AUTH_TOKENS[user.email] = userLoginRes.json('token');
  }

  // Create a database entry using the admin token
  const createDbRes = http.post(`${BASE_URL}/databases`, JSON.stringify({
    name: 'K6 Target DB',
    dbName: 'target_app_db',
    dialect: 'postgres',
    host: 'db-target', // Should be accessible from backend (docker service name)
    port: 5432,
    username: 'postgres',
    password: 'mysecretpassword',
    ssl: false
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKENS['admin']}`
    }
  });

  check(createDbRes, {
    'database created successfully': (r) => r.status === 201,
    'database ID received': (r) => r.json() && r.json().id !== null
  });
  DB_IDS['k6_target_db'] = createDbRes.json('id');
  console.log('--- K6 Setup Finished ---');

  return { adminToken: AUTH_TOKENS['admin'], dbId: DB_IDS['k6_target_db'] };
}


// Teardown function to run once after all VUs
export function teardown(data) {
  console.log('--- K6 Teardown Started ---');
  // Clean up: delete the created database and users
  if (data.dbId) {
    http.del(`${BASE_URL}/databases/${data.dbId}`, null, {
      headers: { 'Authorization': `Bearer ${data.adminToken}` }
    });
    console.log(`Deleted database ID: ${data.dbId}`);
  }
  // No direct user deletion API, but in a real scenario, you'd clean up.
  console.log('--- K6 Teardown Finished ---');
}

// Default function for VU execution
export default function () {
  const user = users[__VU % users.length]; // Each VU uses a different user from the SharedArray
  const token = AUTH_TOKENS[user.email];
  const dbId = DB_IDS['k6_target_db'];

  // 1. Get List of Databases
  let res = http.get(`${BASE_URL}/databases`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  check(res, { 'get databases status is 200': (r) => r.status === 200 });
  sleep(1);

  // 2. Get details of a specific database
  if (dbId) {
    res = http.get(`${BASE_URL}/databases/${dbId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    check(res, { 'get database by id status is 200': (r) => r.status === 200 });
    sleep(1);

    // 3. Trigger query analysis for the database
    res = http.post(`${BASE_URL}/databases/${dbId}/analyze-queries`, null, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    check(res, { 'analyze queries status is 200': (r) => r.status === 200 });
    sleep(2); // Simulate some processing time

    // 4. Get slow queries for the database
    res = http.get(`${BASE_URL}/queries/slow-queries?databaseId=${dbId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    check(res, { 'get slow queries status is 200': (r) => r.status === 200 });
    const slowQueryId = res.json('0.id'); // Assuming there's at least one slow query
    sleep(1);

    // 5. Get explain plan for a slow query
    if (slowQueryId) {
      res = http.get(`${BASE_URL}/queries/${slowQueryId}/explain-plan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      check(res, { 'get explain plan status is 200': (r) => r.status === 200 });
      sleep(1);
    }
  }

  // Simulate user thinking time
  sleep(Math.random() * 5);
}
```