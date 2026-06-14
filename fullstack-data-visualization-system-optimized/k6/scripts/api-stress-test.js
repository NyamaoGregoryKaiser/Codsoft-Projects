```javascript
// k6/scripts/api-stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load test data (e.g., pre-registered user credentials)
const users = new SharedArray('users', function () {
  return JSON.parse(open('../data/users.json')).users;
});

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 virtual users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 VUs for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 VUs over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const user = users[__VU % users.length]; // Use different user for each virtual user
  const BASE_URL = __ENV.BACKEND_URL || 'http://localhost:3000/api';

  // 1. Login to get a token
  const loginRes = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    }
  );
  check(loginRes, {
    'login status is 201': (r) => r.status === 201,
    'login token exists': (r) => r.json() && r.json().accessToken,
  });

  const authToken = loginRes.json('accessToken');
  if (!authToken) {
    console.error('Failed to get auth token, skipping further requests.');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  sleep(1); // Simulate user think time

  // 2. Fetch dashboards
  const dashboardsRes = http.get(`${BASE_URL}/dashboards`, {
    headers: headers,
    tags: { name: 'GetDashboards' },
  });
  check(dashboardsRes, {
    'get dashboards status is 200': (r) => r.status === 200,
    'dashboards count > 0': (r) => r.json().length > 0,
  });

  sleep(1);

  // 3. Fetch a specific dashboard (assuming ID 1 exists from seed data)
  const dashboardId = 'sample-dashboard'; // Use an ID from seeded data
  const dashboardRes = http.get(`${BASE_URL}/dashboards/${dashboardId}`, {
    headers: headers,
    tags: { name: 'GetSpecificDashboard' },
  });
  check(dashboardRes, {
    'get dashboard status is 200': (r) => r.status === 200,
    'dashboard name is correct': (r) => r.json('name') === 'Executive Sales Dashboard',
  });

  sleep(1);

  // 4. Fetch data for a specific chart (assuming ID 1 exists from seed data)
  const chartId = 'sample-bar-chart'; // Use an ID from seeded data
  const chartDataRes = http.get(`${BASE_URL}/charts/${chartId}/data`, {
    headers: headers,
    tags: { name: 'GetChartData' },
  });
  check(chartDataRes, {
    'get chart data status is 200': (r) => r.status === 200,
    'chart data is not empty': (r) => r.json() && r.json().length > 0,
  });
}
```