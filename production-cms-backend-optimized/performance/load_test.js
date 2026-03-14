```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

// Load environment variables for local testing
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://js.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';
const USER_EMAIL = __ENV.USER_EMAIL || 'admin@example.com';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'Admin@123';

const Failures = new Counter('failed_requests');

// Data for dynamic content creation/update
const contentTypes = new SharedArray('contentTypes', function () {
  return JSON.parse(open('../backend/tests/performance/content_types.json')).contentTypes;
});

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '20s', target: 0 },   // Ramp down to 0 users over 20 seconds
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% of requests should be below 500ms, 99% below 1s
    'http_req_failed': ['rate<0.01'],                 // Less than 1% of requests should fail
    'failed_requests': ['count<10'],                  // Max 10 custom failed requests
  },
  ext: {
    loadimpact: {
      projectID: 123456, // Replace with your k6 Cloud Project ID
      name: 'CMS API Load Test',
    },
  },
};

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    "stdout": textSummary(data, { indent: " ", enableColors: true }),
  };
}

// Global variable to store the JWT token
let authToken = '';

export function setup() {
  console.log('Running setup function...');
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });

  check(loginRes, {
    'login successful': (resp) => resp.status === 200 && resp.json('token') !== undefined,
  });

  if (loginRes.status !== 200) {
    console.error('Login failed in setup:', loginRes.body);
    throw new Error('Login failed, cannot proceed with tests.');
  }

  authToken = loginRes.json('token');
  console.log('Auth token obtained in setup.');

  // Create initial content types if not present (assuming for test environment)
  // This part would ideally be in a separate data setup script for real perf tests.
  contentTypes.forEach(ct => {
    const res = http.post(`${BASE_URL}/content-types`, JSON.stringify(ct), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'create_content_type' },
    });
    // console.log(`Created content type ${ct.name}: ${res.status}`);
  });

  return { authToken: authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  // 1. Get all content items (read operation)
  const getRes = http.get(`${BASE_URL}/content-items?limit=10&offset=0`, {
    headers: headers,
    tags: { name: 'get_content_items' },
  });
  check(getRes, {
    'GET /content-items is status 200': (r) => r.status === 200,
  }) || Failures.add(1);
  sleep(1);

  // 2. Create a new content item (write operation)
  const randomContentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
  const postData = {
    contentTypeId: randomContentType.id, // Assuming contentTypes have 'id' from setup or seed
    data: {
      title: `Test Post from k6 - ${__VU}-${__ITER}-${Math.random()}`,
      body: `This is the body for a post created by k6 virtual user ${__VU} iteration ${__ITER}.`,
      tags: ['k6', 'load-test', `vu-${__VU}`],
    },
    status: 'draft',
  };

  const postRes = http.post(`${BASE_URL}/content-items`, JSON.stringify(postData), {
    headers: headers,
    tags: { name: 'create_content_item' },
  });
  check(postRes, {
    'POST /content-items is status 201': (r) => r.status === 201,
  }) || Failures.add(1);
  sleep(1);

  // 3. Get a specific content item (read operation)
  if (postRes.status === 201) {
    const newContentItemId = postRes.json('id');
    const getSingleRes = http.get(`${BASE_URL}/content-items/${newContentItemId}`, {
      headers: headers,
      tags: { name: 'get_single_content_item' },
    });
    check(getSingleRes, {
      'GET /content-items/{id} is status 200': (r) => r.status === 200,
    }) || Failures.add(1);
  }
  sleep(1);
}
```