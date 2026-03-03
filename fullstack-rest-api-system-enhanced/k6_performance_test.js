import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Configure your API base URL
const BASE_URL = 'http://localhost:5000/api/v1';

// Custom metrics
const errorRate = new Rate('errors');
const requestCounter = new Counter('http_requests');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 virtual users over 30 seconds
    { duration: '1m', target: 100 },  // Stay at 100 virtual users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 virtual users over 30 seconds
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should complete within 500ms
    'http_req_failed': ['rate<0.01'],    // Less than 1% of requests should fail
    'errors': ['rate<0.01'],             // Custom error rate less than 1%
  },
};

let authToken = ''; // Token for authenticated requests

// Function to register a new user
function registerUser(username, password) {
  const payload = JSON.stringify({
    firstName: 'Perf',
    lastName: `User${__VU}`,
    email: username,
    password: password,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.post(`${BASE_URL}/auth/register`, payload, params);
  check(res, {
    'register status is 201': (r) => r.status === 201,
  }) || errorRate.add(1);
  return res.json('token');
}

// Function to log in a user
function loginUser(username, password) {
  const payload = JSON.stringify({
    email: username,
    password: password,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  }) || errorRate.add(1);
  return res.json('token');
}

export default function () {
  requestCounter.add(1); // Increment for each request

  // Simulate user authentication flow once per virtual user
  if (__ITER === 0 && __VU === 1) { // Only the first VU of the first iteration registers/logs in
    const email = `perf_user_${__VU}_${__ITER}@example.com`;
    const password = 'password123';
    
    // Register the user (or try to login if already registered)
    const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      firstName: 'Perf',
      lastName: `User${__VU}`,
      email: email,
      password: password,
    }), { headers: { 'Content-Type': 'application/json' } });

    if (registerRes.status === 201 || registerRes.status === 409) { // 409 for conflict (already registered)
        const loginToken = loginUser(email, password);
        if (loginToken) {
            authToken = loginToken;
            console.log(`VU ${__VU} - Login successful, token acquired.`);
        } else {
            console.error(`VU ${__VU} - Failed to acquire token after register/login attempt.`);
        }
    } else {
        console.error(`VU ${__VU} - Failed to register user. Status: ${registerRes.status}, Body: ${registerRes.body}`);
    }
  }

  // If we have a token, perform authenticated actions
  if (authToken) {
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'authenticated_request' }, // Tag requests for filtering in results
    };

    // Simulate creating a task
    const createTaskRes = http.post(`${BASE_URL}/tasks`, JSON.stringify({
      title: `Task for VU ${__VU} - ${__ITER}`,
      description: 'Performance test task description.',
      priority: 'MEDIUM',
      status: 'PENDING',
    }), params);
    check(createTaskRes, { 'create task status is 201': (r) => r.status === 201 }) || errorRate.add(1);
    const taskId = createTaskRes.json('id');
    sleep(1);

    // Simulate getting tasks (with some filters)
    const getTasksRes = http.get(`${BASE_URL}/tasks?status=PENDING&limit=10`, params);
    check(getTasksRes, { 'get tasks status is 200': (r) => r.status === 200 }) || errorRate.add(1);
    sleep(1);

    // Simulate getting a specific task if one was created
    if (taskId) {
        const getTaskRes = http.get(`${BASE_URL}/tasks/${taskId}`, params);
        check(getTaskRes, { 'get single task status is 200': (r) => r.status === 200 }) || errorRate.add(1);
        sleep(1);
    }
    
    // Simulate updating a task
    if (taskId) {
      const updateTaskRes = http.put(`${BASE_URL}/tasks/${taskId}`, JSON.stringify({
        status: 'IN_PROGRESS',
      }), params);
      check(updateTaskRes, { 'update task status is 200': (r) => r.status === 200 }) || errorRate.add(1);
      sleep(1);
    }

    // Simulate deleting a task (cleanup)
    if (taskId) {
      const deleteTaskRes = http.del(`${BASE_URL}/tasks/${taskId}`, null, params);
      check(deleteTaskRes, { 'delete task status is 204': (r) => r.status === 204 }) || errorRate.add(1);
      sleep(1);
    }

  } else {
    // If token acquisition failed, just sleep
    console.error(`VU ${__VU} - No authentication token, skipping authenticated actions.`);
    sleep(5);
  }
}