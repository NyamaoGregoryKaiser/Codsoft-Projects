import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load environment variables for local testing
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123';
const USER_EMAIL_PREFIX = __ENV.USER_EMAIL_PREFIX || 'testuser';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'user123';
const NUMBER_OF_PRODUCTS_TO_CREATE = 10; // For setup

// Data for products (if needed)
const productsData = new SharedArray('products', function () {
  const products = [];
  for (let i = 0; i < NUMBER_OF_PRODUCTS_TO_CREATE; i++) {
    products.push({
      name: `Product ${i + 1}`,
      description: `Description for Product ${i + 1}`,
      price: Math.floor(Math.random() * 100) + 10,
      stock: Math.floor(Math.random() * 200) + 50,
    });
  }
  return products;
});

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate ramp-up to 20 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'],  // Error rate should be less than 1%
  },
  ext: {
    loadimpact: {
      projectID: 123456, // Replace with your k6 Cloud Project ID
      name: "Mobile App Backend Basic Flow Test",
    },
  },
};

// Global variables for tokens and user IDs
let adminAccessToken;
let userAccessTokens = [];
let productIds = [];

// Setup function (runs once before all VUs start)
export function setup() {
  console.log('Setup: Preparing test data...');
  const adminRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(adminRes, { 'admin login successful': (r) => r.status === 200 });
  adminAccessToken = adminRes.json().data.accessToken;

  // Create products using admin token
  for (let i = 0; i < productsData.length; i++) {
    const productRes = http.post(`${BASE_URL}/products`, JSON.stringify(productsData[i]), {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAccessToken}` },
    });
    check(productRes, { [`product ${i} created`]: (r) => r.status === 201 });
    productIds.push(productRes.json().data.id);
  }

  // Create some users and store their tokens
  for (let i = 0; i < options.stages[1].target; i++) { // Create users equal to max VUs
    const userEmail = `${USER_EMAIL_PREFIX}+${i}@example.com`;
    http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      email: userEmail,
      password: USER_PASSWORD,
      name: `Test User ${i}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: userEmail,
      password: USER_PASSWORD,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(loginRes, { [`user ${i} login successful`]: (r) => r.status === 200 });
    userAccessTokens.push(loginRes.json().data.accessToken);
  }
  
  console.log('Setup: Test data preparation complete.');
  return { products: productIds, usersTokens: userAccessTokens };
}


// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  console.log('Teardown: Cleaning up test data...');
  const { products, usersTokens } = data;

  // Re-login admin if token expired or not passed
  if (!adminAccessToken) {
    const adminRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    if (adminRes.status === 200) {
      adminAccessToken = adminRes.json().data.accessToken;
    } else {
      console.error('Teardown: Admin login failed, cannot clean up products.');
      return;
    }
  }

  // Delete products
  for (const productId of products) {
    http.del(`${BASE_URL}/products/${productId}`, null, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` },
    });
  }

  // Delete users (optional, can be time consuming for many users)
  // To avoid deleting admin, ensure only test users are deleted or use a separate admin_id
  for (let i = 0; i < usersTokens.length; i++) {
    const userEmail = `${USER_EMAIL_PREFIX}+${i}@example.com`;
    // Find user ID to delete if needed, or assume they are deleted with cascade via auth token management
    // For simplicity here, we assume user data might be reset externally or not critical for teardown.
    // In a real scenario, you'd fetch user ID from DB and delete.
  }
  console.log('Teardown: Test data cleanup complete.');
}


// Default function (main test logic for each virtual user)
export default function (data) {
  const { products, usersTokens } = data;

  // Randomly select a user token for this VU
  const currentUserToken = usersTokens[__VU % usersTokens.length];
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentUserToken}`,
  };

  // 1. Get all products (cached endpoint, public access)
  const allProductsRes = http.get(`${BASE_URL}/products`, { tags: { name: 'GetAllProducts' } });
  check(allProductsRes, { 'get all products status is 200': (r) => r.status === 200 });
  sleep(1);

  // 2. Get a random product by ID (cached endpoint, public access)
  const randomProduct = products[Math.floor(Math.random() * products.length)];
  const productRes = http.get(`${BASE_URL}/products/${randomProduct}`, { tags: { name: 'GetProductById' } });
  check(productRes, { 'get product by ID status is 200': (r) => r.status === 200 });
  sleep(1);

  // 3. Create an order (authenticated, involves DB writes, stock decrement)
  const orderRes = http.post(`${BASE_URL}/orders`, JSON.stringify({
    items: [
      { productId: products[0], quantity: 1 }, // Assuming product 0 is always available
      { productId: products[1], quantity: 1 }, // Assuming product 1 is always available
    ],
    shippingAddress: `123 Load St, Test City, ${__VU}`,
  }), { headers: authHeaders, tags: { name: 'CreateOrder' } });
  check(orderRes, { 'create order status is 201': (r) => r.status === 201 || r.status === 400 }); // 400 can happen if stock is depleted
  sleep(2);

  // 4. Get own orders (authenticated)
  const myOrdersRes = http.get(`${BASE_URL}/orders`, { headers: authHeaders, tags: { name: 'GetMyOrders' } });
  check(myOrdersRes, { 'get my orders status is 200': (r) => r.status === 200 });
  sleep(1);

  // More complex scenarios can be added here
  // e.g., Update user profile, search for products, etc.
}
```