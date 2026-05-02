```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load test data for user credentials
const users = new SharedArray('users', function () {
  return [
    { username: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
    { username: 'testuser', email: 'user@example.com', password: 'password123', role: 'user' },
    // Add more test users as needed, or register them dynamically if the app allows
  ];
});

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 virtual users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 virtual users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 virtual users over 30 seconds
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
  ext: {
    loadimpact: {
      projectID: 123456, // Replace with your k6 Cloud project ID if using Cloud
      name: 'DevOps Automation System Performance Test',
    },
  },
};

export default function () {
  // Base URL for the backend API
  const BASE_URL = 'http://localhost:5000/api';

  // Randomly select a user for each virtual user iteration
  const user = users[__VU % users.length];

  let authToken = '';

  // 1. Authenticate (login)
  let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json() && r.json().token !== '',
  });

  if (loginRes.status === 200) {
    authToken = loginRes.json().token;
  } else {
    console.error(`Login failed for ${user.email}: ${loginRes.body}`);
    return; // Stop if login fails for this VU
  }

  // Set Authorization header for subsequent requests
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };

  sleep(1); // Wait 1 second after login

  // 2. Get User Profile (protected route)
  let profileRes = http.get(`${BASE_URL}/auth/profile`, authHeaders);
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile has username': (r) => r.json() && r.json().username === user.username,
  });
  sleep(1);

  // 3. Get All Products (cached route)
  let productsRes = http.get(`${BASE_URL}/products`, authHeaders);
  check(productsRes, {
    'get products status is 200': (r) => r.status === 200,
    'get products has results': (r) => r.json() && r.json().rows.length > 0,
  });
  sleep(1);

  // 4. Get a specific product (randomly from the fetched list or a known ID)
  if (productsRes.json() && productsRes.json().rows.length > 0) {
    const product = productsRes.json().rows[0]; // Take the first product
    let singleProductRes = http.get(`${BASE_URL}/products/${product.id}`, authHeaders);
    check(singleProductRes, {
      'get single product status is 200': (r) => r.status === 200,
      'get single product has name': (r) => r.json() && r.json().name === product.name,
    });
    sleep(1);
  }

  // 5. Create a product (only for users with permission, e.g., admin or regular user)
  if (user.role === 'admin' || user.role === 'user') { // Both admin and regular user can create products
    let createProductRes = http.post(`${BASE_URL}/products`, JSON.stringify({
      name: `K6 Test Product ${__VU}-${__ITER}`,
      description: 'Created during k6 performance test',
      price: (Math.random() * 100).toFixed(2),
      stock: Math.floor(Math.random() * 100),
    }), authHeaders);

    check(createProductRes, {
      'create product status is 201': (r) => r.status === 201,
      'create product has ID': (r) => r.json() && r.json().id !== '',
    });
    sleep(1);
  }
}
```