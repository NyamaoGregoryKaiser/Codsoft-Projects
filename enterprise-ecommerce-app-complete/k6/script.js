```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 100 },  // Stay at 100 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests must complete within 500ms, 99% within 1s
    http_req_failed: ['rate<0.01'],                 // less than 1% of requests should fail
    checks: ['rate>0.99'],                          // 99% of checks must pass
  },
};

// Data for login (e.g., pre-registered users)
const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json')).users; // Assuming users.json has an array of { email, password }
});

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api/v1';

export default function () {
  let res;
  const user = users[__VU % users.length]; // Each virtual user gets a different user from the array

  // 1. Home page / Product list (GET) - Most frequent
  res = http.get(`${BASE_URL}/products?limit=10&page=1`, {
    tags: { name: 'GetProducts' },
  });
  check(res, { 'GetProducts status is 200': (r) => r.status === 200 });
  sleep(1);

  // 2. View a specific product (GET)
  const products = res.json()?.data?.products;
  if (products && products.length > 0) {
    const productId = products[0].id; // Pick the first product
    res = http.get(`${BASE_URL}/products/${productId}`, {
      tags: { name: 'GetProductDetail' },
    });
    check(res, { 'GetProductDetail status is 200': (r) => r.status === 200 });
  }
  sleep(1);

  // 3. Login (POST) - Less frequent but important for auth flow
  res = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    }
  );
  check(res, { 'Login status is 200': (r) => r.status === 200, 'Login successful': (r) => r.json().token !== undefined });
  const authToken = res.json()?.token;
  sleep(1);

  // If logged in, perform authenticated actions
  if (authToken) {
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    };

    // 4. View User Profile (GET, authenticated)
    res = http.get(`${BASE_URL}/auth/me`, {
      tags: { name: 'GetProfile' },
      ...authHeaders,
    });
    check(res, { 'GetProfile status is 200': (r) => r.status === 200 });
    sleep(1);

    // 5. Add to cart (POST, authenticated) - Requires product ID.
    // This part requires product IDs from the database, ideally seeded for testing.
    // For a real test, you'd fetch an ID or use a known one.
    // Example: post to /api/v1/cart/add with { productId: '...', quantity: 1 }
    // As product IDs are dynamic, this is a placeholder.
    // res = http.post(`${BASE_URL}/cart/add`, JSON.stringify({ productId: 'some-valid-product-id', quantity: 1 }), {
    //   tags: { name: 'AddToCart' },
    //   ...authHeaders,
    // });
    // check(res, { 'AddToCart status is 201': (r) => r.status === 201 });
    // sleep(1);
  }
}
```