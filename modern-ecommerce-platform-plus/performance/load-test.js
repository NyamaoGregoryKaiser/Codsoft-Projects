import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate ramp-up to 20 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be less than 1%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api/v1';

export default function () {
  let accessToken = '';
  // 1. User registration (less frequent)
  if (__ITER === 0) { // Only the first virtual user registers
    const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      name: `Test User ${__VU}-${__ITER}`,
      email: `test${__VU}-${__ITER}@example.com`,
      password: 'testpassword123'
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Auth_Register' },
    });
    check(registerRes, {
      'register status is 201': (r) => r.status === 201,
      'register has userId': (r) => r.json('data.userId') !== null,
    });
    sleep(1);
  }

  // 2. Login (more frequent)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: `test${__VU}-${__ITER}@example.com`,
    password: 'testpassword123'
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Auth_Login' },
  });
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => r.json('data.tokens.access.token') !== null,
  });
  accessToken = loginRes.json('data.tokens.access.token');
  sleep(1);

  // 3. Browse products (most frequent)
  const productsRes = http.get(`${BASE_URL}/products?limit=10&page=1`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    tags: { name: 'Products_List' },
  });
  check(productsRes, {
    'products list status is 200': (r) => r.status === 200,
    'products list has data': (r) => r.json('data.products') !== null,
  });
  const products = productsRes.json('data.products');
  sleep(1);

  // 4. View a specific product (randomly pick one)
  if (products && products.length > 0) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const productDetailRes = http.get(`${BASE_URL}/products/${randomProduct.id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { name: 'Product_Detail' },
    });
    check(productDetailRes, {
      'product detail status is 200': (r) => r.status === 200,
      'product detail has name': (r) => r.json('data.name') === randomProduct.name,
    });
  }
  sleep(1);

  // 5. Add to cart (less frequent, requires authentication)
  // This is a placeholder as cart logic is mocked in frontend and not fully implemented on backend in this example.
  // In a real scenario, this would be an authenticated POST request to /api/v1/cart/items
  if (accessToken && products && products.length > 0 && Math.random() < 0.2) { // 20% chance to add to cart
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const addToCartRes = http.post(`${BASE_URL}/cart/items`, JSON.stringify({
          productId: randomProduct.id,
          quantity: 1,
      }), {
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
          },
          tags: { name: 'Cart_AddItem' },
      });
      check(addToCartRes, {
          'add to cart status is 200': (r) => r.status === 200,
      });
  }
  sleep(1);
}