import http from 'k6/http';
import { check, sleep } from 'k6';

// This is a basic example. For real scenarios, you'd parameterize user credentials,
// warm up the system, and simulate more complex flows.

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate ramp-up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '20s', target: 0 },  // Ramp-down to 0 users over 20 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],  // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  let accessToken = '';
  let refreshToken = '';

  // 1. Register a new user (to ensure unique users per test run, or use seeded users)
  const registerPayload = {
    name: `Test User ${__VU}-${__ITER}`,
    email: `test_user_${__VU}_${__ITER}@example.com`,
    password: 'Password123!',
  };
  let res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(registerPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Register' },
  });
  check(res, { 'register status is 201': (r) => r.status === 201 });
  sleep(0.5);

  // 2. Login
  const loginPayload = {
    email: registerPayload.email,
    password: registerPayload.password,
  };
  res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });
  check(res, { 'login status is 200': (r) => r.status === 200 });

  accessToken = res.cookies['accessToken'][0].value;
  refreshToken = res.cookies['refreshToken'][0].value;
  check(accessToken, { 'access token exists': (t) => t !== '' });
  check(refreshToken, { 'refresh token exists': (t) => t !== '' });
  sleep(1);

  // 3. Access Protected Resource (e.g., Get Products)
  res = http.get(`${BASE_URL}/products`, {
    cookies: { accessToken, refreshToken }, // Pass cookies
    tags: { name: 'Get Products' },
  });
  check(res, { 'get products status is 200': (r) => r.status === 200 });
  sleep(1);

  // 4. Create a Product (Admin only, requires admin role on registration or manual update)
  // For this example, let's assume the registered user is 'user' role by default.
  // If simulating admin:
  // if (registerPayload.email.includes('admin')) { ... }
  // To simulate admin actions, one would need to login as an admin user.
  // This test focuses on general user flow.

  // 5. Logout
  res = http.post(`${BASE_URL}/auth/logout`, null, {
    cookies: { accessToken, refreshToken },
    tags: { name: 'Logout' },
  });
  check(res, { 'logout status is 200': (r) => r.status === 200 });
  sleep(0.5);
}
```

---

### 5. Documentation

#### Comprehensive README

```markdown