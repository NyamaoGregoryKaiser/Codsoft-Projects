```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load environment variables for local testing
// In a real CI/CD environment, these would be passed as k6 environment variables
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/v1';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'password123';

// Prepare test data (e.g., user credentials for login)
const users = new SharedArray('users', function () {
  return [
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    // Add more test users if needed
  ];
});

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Warm-up: 20 users for 30 seconds
    { duration: '1m', target: 50 },  // Steady-state: 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down: 0 users for 30 seconds
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
};

export default function () {
  let res;
  let accessToken;

  // 1. Authenticate an admin user
  const adminUser = users[0];
  res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: adminUser.email,
    password: adminUser.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has accessToken': (r) => r.json() && r.json().accessToken !== '',
  });

  if (res.status === 200) {
    accessToken = res.json().accessToken;
  } else {
    console.error(`Login failed: ${res.status} - ${res.body}`);
    return; // Stop if login fails
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  // 2. Get all projects (cached route)
  res = http.get(`${BASE_URL}/projects`, { headers: authHeaders });
  check(res, {
    'get projects status is 200': (r) => r.status === 200,
  });
  sleep(1); // Think time

  // 3. Create a new project (non-cached, write operation)
  const projectName = `Test Project ${__VU}-${__ITER}`;
  res = http.post(`${BASE_URL}/projects`, JSON.stringify({
    name: projectName,
    description: 'Project created during performance test',
  }), { headers: authHeaders });

  check(res, {
    'create project status is 201': (r) => r.status === 201,
  });

  let projectId;
  if (res.status === 201) {
    projectId = res.json().id;
    // 4. Get the created project by ID
    res = http.get(`${BASE_URL}/projects/${projectId}`, { headers: authHeaders });
    check(res, {
      'get project by ID status is 200': (r) => r.status === 200,
      'get project by ID name matches': (r) => r.json().name === projectName,
    });
  }
  sleep(1);

  // 5. Simulate browsing tasks within a project (if project was created)
  if (projectId) {
    res = http.get(`${BASE_URL}/projects/${projectId}/tasks`, { headers: authHeaders });
    check(res, {
      'get tasks status is 200': (r) => r.status === 200,
    });
    sleep(1);
  }
}
```