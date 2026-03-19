import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // A simple scenario to demonstrate load
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

export default function () {
  // Simulate user login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'user@example.com', // Use a seeded user for performance tests
    password: 'user123',
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });

  check(loginRes, {
    'Login: status is 200': (r) => r.status === 200,
    'Login: has token': (r) => r.json() && r.json().token !== '',
  });

  if (loginRes.status === 200) {
    const authToken = loginRes.json().token;

    // Simulate getting tasks
    const tasksRes = http.get(`${BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'GetTasks' },
    });

    check(tasksRes, {
      'GetTasks: status is 200': (r) => r.status === 200,
      'GetTasks: has tasks array': (r) => Array.isArray(r.json()),
    });
  }

  sleep(1); // Think time between requests
}