import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load environment variables for the test
const config = JSON.parse(open('./src/config/index.ts')); // This won't work directly, need to parse.
// For K6, you usually pass environment variables: k6 run -e API_URL=http://localhost:3000 performance-test.js
const API_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

// Shared data for users to avoid recreating for each VU
const users = new SharedArray('users', function () {
  const adminEmail = __ENV.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = __ENV.ADMIN_PASSWORD || 'adminpassword123';

  const res = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: adminEmail,
    password: adminPassword,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'login successful': (resp) => resp.status === 200,
    'has access token': (resp) => resp.json().accessToken !== undefined,
  });

  return [{
    token: res.json().accessToken,
    id: res.json().user.id,
    email: res.json().user.email,
    role: res.json().user.role,
  }];
});

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate 20 users for 30 seconds
    { duration: '1m', target: 50 },  // Ramp up to 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const user = users[0]; // For simplicity, all VUs use the same admin token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.token}`,
  };

  // Test 1: Get all projects (cached route)
  let res = http.get(`${API_URL}/projects`, { headers });
  check(res, {
    'get projects status is 200': (r) => r.status === 200,
    'get projects response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1); // Simulate user think time

  // Test 2: Create a new project (uncached, requires write operation)
  const projectName = `K6 Test Project ${Math.random().toString(36).substring(2, 7)}`;
  res = http.post(`${API_URL}/projects`, JSON.stringify({
    name: projectName,
    description: 'Project created by K6 performance test.',
  }), { headers });
  check(res, {
    'create project status is 201': (r) => r.status === 201,
    'create project response time < 500ms': (r) => r.timings.duration < 500,
  });
  const newProjectId = res.json()?.id;
  sleep(1);

  // Test 3: Get a specific project (cached route)
  if (newProjectId) {
    res = http.get(`${API_URL}/projects/${newProjectId}`, { headers });
    check(res, {
      'get specific project status is 200': (r) => r.status === 200,
      'get specific project response time < 200ms': (r) => r.timings.duration < 200,
    });
  }
  sleep(1);

  // Test 4: Get all users (admin-only, uncached)
  if (user.role === 'admin') {
    res = http.get(`${API_URL}/users`, { headers });
    check(res, {
      'get users status is 200 (admin)': (r) => r.status === 200,
      'get users response time < 300ms': (r) => r.timings.duration < 300,
    });
  }
  sleep(1);

  // You would typically delete the created project/data after the test to keep the database clean,
  // but K6 runs parallel. Best to handle cleanup separately or with unique data.
}
```

**How to run K6 performance test:**
1.  Install K6: `brew install k6` (macOS) or refer to k6.io for other OS.
2.  Navigate to `pms-api/backend/` directory.
3.  Ensure your backend is running (e.g., `docker-compose up --build`).
4.  Run the test: `k6 run -e API_URL=http://localhost:3000/api/v1 -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=adminpassword123 performance-test.js`

---

### 7. Documentation

#### `pms-api/README.md`
```markdown