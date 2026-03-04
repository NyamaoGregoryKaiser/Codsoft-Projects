import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Warm-up: 20 VUs for 30 seconds
    { duration: '1m', target: 50 },  // Load test: 50 VUs for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down: 0 VUs for 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:5000/api'; // Replace with your backend URL

export default function () {
  // Test scenario: Publicly view products
  let res = http.get(`${BASE_URL}/products`);
  check(res, {
    'GET /products status is 200': (r) => r.status === 200,
    'GET /products body has products': (r) => r.json().data.products.length > 0,
  });

  sleep(1); // Simulate user think time

  // Test scenario: Authenticated actions (login and get user products)
  // This part would involve a proper login flow to get a token
  // For simplicity, this example assumes a token is already available or hardcoded for a test user
  const loginRes = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'user@example.com', password: 'userpassword' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login token exists': (r) => r.json().token !== undefined,
  });

  let authToken = loginRes.json().token;

  if (authToken) {
    res = http.get(`${BASE_URL}/products`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    check(res, {
      'Auth GET /products status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

/*
To run this k6 test:
1. Install k6: https://k6.io/docs/get-started/installation/
2. Save the above content as `k6_load_test.js` in `server/tests/performance/`
3. Make sure your Dockerized application is running (`docker compose up`)
4. From your terminal, navigate to the `server/tests/performance/` directory and run:
   k6 run k6_load_test.js
*/