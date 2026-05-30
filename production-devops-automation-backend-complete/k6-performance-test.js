```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load test users from a JSON file
const testUsers = new SharedArray('testUsers', function () {
  return JSON.parse(open('./tests/users.json')).users;
});

export const options = {
  vus: 10,  // 10 virtual users
  duration: '30s', // For 30 seconds
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
};

export function setup() {
  console.log('Running k6 setup...');
  // This setup runs once for the entire test.
  // We can use it to register/login users and get tokens.
  // For simplicity, we'll assume testUsers array has pre-registered users.
  // In a real scenario, you'd implement actual login requests here.

  const initialTokens = testUsers.map(user => {
    const loginRes = http.post('http://localhost:5000/api/v1/auth/login', JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login_User_Setup' },
    });

    check(loginRes, {
      'login successful': (resp) => resp.status === 200 && resp.json().token !== undefined,
    });

    return { email: user.email, token: loginRes.json()?.token };
  });

  return { tokens: initialTokens.filter(t => t.token) };
}

export default function (data) {
  const user = testUsers[__VU % testUsers.length]; // Each VU uses a different user from the array
  const authToken = data.tokens.find(t => t.email === user.email)?.token;

  if (!authToken) {
    console.error(`User ${user.email} failed to get auth token in setup. Skipping requests.`);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  // 1. Get all projects (simulates dashboard view)
  let res = http.get('http://localhost:5000/api/v1/projects', {
    headers: headers,
    tags: { name: 'Get_All_Projects' },
  });
  check(res, { 'get all projects status is 200': (r) => r.status === 200 });

  // 2. Get a specific project (if any exists)
  if (res.json() && res.json().length > 0) {
    const projectId = res.json()[0].id;
    res = http.get(`http://localhost:5000/api/v1/projects/${projectId}`, {
      headers: headers,
      tags: { name: 'Get_Single_Project' },
    });
    check(res, { 'get single project status is 200': (r) => r.status === 200 });

    // 3. Create a task in that project (only for non-admin to avoid test pollution)
    if (user.role === 'user') {
        const createRandomTaskRes = http.post(`http://localhost:5000/api/v1/projects/${projectId}/tasks`, JSON.stringify({
            title: `Task ${__VU}-${Date.now()}`,
            description: 'Performance test task',
            status: 'pending',
            priority: 'low',
        }), {
            headers: headers,
            tags: { name: 'Create_Task' },
        });
        check(createRandomTaskRes, { 'create task status is 201': (r) => r.status === 201 });
    }
  }


  sleep(1); // Simulate user think time
}
```