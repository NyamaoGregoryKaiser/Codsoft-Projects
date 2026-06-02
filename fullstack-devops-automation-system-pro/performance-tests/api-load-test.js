import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Configuration for the load test
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate 20 users for 30 seconds
    { duration: '1m', target: 50 },  // Ramp up to 50 users over 1 minute
    { duration: '30s', target: 20 }, // Ramp down to 20 users for 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
  },
};

// Test data for login (replace with actual test user credentials)
const users = new SharedArray('users', function () {
  return [
    { username: 'admin', password: 'admin' },
    { username: 'user1', password: 'user1' },
    // Add more test users if needed
  ];
});

// Function to get a JWT token
function getAuthToken(user) {
  const url = `${__ENV.BASE_URL}/auth/login`;
  const payload = JSON.stringify({
    username: user.username,
    password: user.password,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.post(url, payload, params);
  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login token exists': (r) => r.json() && r.json().token !== '',
  });
  return res.json('token');
}

export default function () {
  const user = users[__VU % users.length]; // Each virtual user gets a different user from the array
  const authToken = getAuthToken(user);

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // 1. Get all projects (simulating dashboard load)
  let res = http.get(`${__ENV.BASE_URL}/projects`, authHeaders);
  check(res, { 'get projects status is 200': (r) => r.status === 200 });
  sleep(1);

  // 2. Get a specific project (assuming project with ID 1 exists)
  res = http.get(`${__ENV.BASE_URL}/projects/1`, authHeaders);
  check(res, { 'get project by id status is 200': (r) => r.status === 200 });
  sleep(1);

  // 3. Create a new task (POST request)
  const newTaskPayload = JSON.stringify({
    title: `New Task from ${user.username} - ${__VU}-${__ITER}`,
    description: `Description for new task ${__VU}-${__ITER}`,
    status: 'OPEN',
    priority: 'MEDIUM',
    projectId: 1, // Assuming project with ID 1 exists
    assignedToId: user.username === 'admin' ? 1 : 2, // Assign dynamically
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] + "T00:00:00"
  });
  res = http.post(`${__ENV.BASE_URL}/tasks`, newTaskPayload, authHeaders);
  check(res, { 'create task status is 201': (r) => r.status === 201 });
  sleep(1);

  // You can add more API calls here to simulate different user flows:
  // - Update a task
  // - Get all tasks
  // - Delete a task (less frequent)
  // - Register a new user (less frequent, usually not done under load)
}
```
To run this, install k6 (`brew install k6` or `choco install k6`) and execute:
`k6 run -e BASE_URL=http://localhost:8080/api performance-tests/api-load-test.js`

---

### **5. Documentation**

#### **`README.md`**
```markdown