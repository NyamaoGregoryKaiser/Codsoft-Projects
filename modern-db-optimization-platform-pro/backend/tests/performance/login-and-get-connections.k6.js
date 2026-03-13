```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load environment variables for credentials (for K6, these should be securely managed)
// You would typically pass these as CLI arguments or environment variables to k6
// k6 run --env K6_USERNAME=admin --env K6_PASSWORD=adminpassword login-and-get-connections.k6.js
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = __ENV.K6_USERNAME || 'admin';
const ADMIN_PASSWORD = __ENV.K6_PASSWORD || 'adminpassword';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 virtual users over 30 seconds
    { duration: '1m', target: 50 },   // Stay at 50 VUs for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 VUs over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be below 500ms, 99% below 1s
    http_req_failed: ['rate<0.01'],                 // Less than 1% of requests should fail
  },
};

// Data for creating connections (to ensure we have some data to fetch)
const connectionsData = new SharedArray('connectionsData', function () {
  return JSON.parse(open('../../src/seeds/mock-connections.json')).map(conn => ({
    ...conn,
    dbPassword: 'securepassword', // Use a generic password for seeding during perf test
  }));
});

export function setup() {
  // 1. Initial Login to get admin token
  const loginRes = http.post(`${API_BASE_URL}/auth/login`, JSON.stringify({
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (resp) => resp.status === 200 && resp.json().token !== undefined,
  });

  const token = loginRes.json().token;
  const adminId = loginRes.json().user.id;

  // 2. Seed some database connections for the admin user if they don't exist
  // This is run once for the whole test.
  if (token) {
    for (const conn of connectionsData) {
      const checkRes = http.get(`${API_BASE_URL}/connections`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const existing = checkRes.json().data.some(c => c.name === conn.name);

      if (!existing) {
        const createRes = http.post(`${API_BASE_URL}/connections`, JSON.stringify({
          userId: adminId, // Not actually needed by API, but good for data structure clarity
          name: conn.name,
          host: conn.host,
          port: conn.port,
          dbName: conn.dbName,
          dbUser: conn.dbUser,
          dbPassword: conn.dbPassword,
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        check(createRes, {
          'connection created successfully': (resp) => resp.status === 201,
        });
        sleep(0.1); // Small sleep to avoid hammering
      }
    }
  }

  return { token: token, adminId: adminId };
}

export default function (data) {
  const token = data.token;
  const adminId = data.adminId;

  // Simulate a user logging in for each VU (or re-using token)
  // For simplicity, we'll re-use the setup token here,
  // but in a more complex test, each VU might have its own login.

  // 1. Get user profile
  const profileRes = http.get(`${API_BASE_URL}/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
    tags: { name: 'GetProfile' },
  });
  check(profileRes, {
    'GetProfile status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. Get database connections
  const connectionsRes = http.get(`${API_BASE_URL}/connections`, {
    headers: { 'Authorization': `Bearer ${token}` },
    tags: { name: 'GetConnections' },
  });
  check(connectionsRes, {
    'GetConnections status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // If there are connections, pick one and try to get its metrics
  if (connectionsRes.json().data && connectionsRes.json().data.length > 0) {
    const connectionId = connectionsRes.json().data[0].id; // Get the first connection

    // 3. Get active queries
    const activeQueriesRes = http.get(`${API_BASE_URL}/monitor/${connectionId}/active-queries`, {
      headers: { 'Authorization': `Bearer ${token}` },
      tags: { name: 'GetActiveQueries' },
    });
    check(activeQueriesRes, {
      'GetActiveQueries status is 200': (r) => r.status === 200,
    });
    sleep(1);

    // 4. Get indexes
    const indexesRes = http.get(`${API_BASE_URL}/monitor/${connectionId}/indexes`, {
      headers: { 'Authorization': `Bearer ${token}` },
      tags: { name: 'GetIndexes' },
    });
    check(indexesRes, {
      'GetIndexes status is 200': (r) => r.status === 200,
    });
    sleep(1);
  }
}
```