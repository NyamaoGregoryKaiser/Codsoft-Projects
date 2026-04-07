```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Configuration for the load test
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 100 }, // Stay at 100 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
  },
};

// Base URL for your backend API
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api/v1';

// Shared data: Test users for login and their tokens
// This simulates users already having registered accounts.
const users = new SharedArray('users', function () {
  // In a real scenario, you would dynamically fetch or generate test users
  // and pre-register them. For this example, we use the seeded admin user.
  // The admin user is created via db:seed:all in the backend's start script.
  return [
    { username: 'admin', email: 'admin@example.com', password: 'adminpassword', role: 'admin' },
  ];
});

// Authenticate a user and return the JWT token
function authenticate(user) {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (resp) => resp.status === 200 && resp.json('token') !== undefined,
  });

  return loginRes.json('token');
}

export default function () {
  // Each VU (Virtual User) will pick one user from the shared array
  const user = users[__VU % users.length];
  const token = authenticate(user);

  if (!token) {
    console.error(`VU ${__VU}: Failed to authenticate user ${user.username}`);
    return; // Stop current VU if auth fails
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Get all models (cached endpoint)
  let res = http.get(`${BASE_URL}/models`, { headers });
  check(res, {
    'get all models successful': (r) => r.status === 200,
    'get all models returns data': (r) => r.json('data.models').length > 0,
  });
  sleep(1);

  // 2. Get all datasets (cached endpoint)
  res = http.get(`${BASE_URL}/datasets`, { headers });
  check(res, {
    'get all datasets successful': (r) => r.status === 200,
    'get all datasets returns data': (r) => r.json('data.datasets').length > 0,
  });
  sleep(1);

  // 3. Get a specific model by ID (cached endpoint)
  // Assuming at least one model exists from seeding
  const modelsRes = http.get(`${BASE_URL}/models`, { headers });
  const modelId = modelsRes.json('data.models.0.id');
  if (modelId) {
    res = http.get(`${BASE_URL}/models/${modelId}`, { headers });
    check(res, {
      'get specific model successful': (r) => r.status === 200,
      'get specific model returns data': (r) => r.json('data.model.id') === modelId,
    });
    sleep(1);
  } else {
    console.warn(`VU ${__VU}: No models found to query by ID.`);
  }

  // 4. Run inference on a model (non-cached, simulates external call)
  if (modelId) {
    const inferencePayload = {
      feature_a: Math.random() * 100,
      feature_b: 'category_' + Math.floor(Math.random() * 5),
    };
    res = http.post(`${BASE_URL}/models/${modelId}/infer`, JSON.stringify(inferencePayload), { headers });
    check(res, {
      'run inference successful': (r) => r.status === 200,
      'run inference returns result': (r) => r.json('data.inference_result') !== undefined,
    });
    sleep(1);
  }

  // 5. Get inference logs (paginated, filtered endpoint - not cached heavily)
  res = http.get(`${BASE_URL}/inference-logs?page=1&limit=5`, { headers });
  check(res, {
    'get inference logs successful': (r) => r.status === 200,
  });
  sleep(1);

  // Introduce a slight pause between iterations to simulate realistic user behavior
  sleep(Math.random() * 3 + 2); // Random sleep between 2 and 5 seconds
}
```