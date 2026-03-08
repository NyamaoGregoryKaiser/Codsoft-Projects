```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load environment variables (from Docker Compose for example)
const BASE_URL = __ENV.PMS_BACKEND_URL || 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = __ENV.PMS_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.PMS_ADMIN_PASSWORD || 'adminpassword';

// Data for new users and projects (to ensure unique values per test run)
const uniqueId = new Date().getTime();
const TEST_USER_EMAIL = `testuser_${uniqueId}@example.com`;
const TEST_USER_PASSWORD = `testpassword_${uniqueId}`;
const TEST_PROJECT_NAME = `Test Project ${uniqueId}`;
const TEST_PROJECT_DESCRIPTION = `Project created by k6 test ${uniqueId}`;

let AUTH_TOKEN = '';
let PROJECT_ID = '';
let API_KEY = '';

export let options = {
  vus: 10,  // 10 virtual users
  duration: '1m', // for 1 minute
  // A higher load profile for more intense testing:
  // stages: [
  //   { duration: '30s', target: 20 }, // ramp up to 20 users
  //   { duration: '1m', target: 20 },  // stay at 20 users
  //   { duration: '30s', target: 0 },  // ramp down to 0 users
  // ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // less than 1% of requests should fail
  },
};

export function setup() {
  console.log('--- K6 Test Setup Started ---');

  // 1. Register a test user
  let registerPayload = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    firstName: 'K6',
    lastName: 'Test',
  };
  let registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify(registerPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Auth_Register' },
  });
  check(registerRes, { 'user registered successfully': (r) => r.status === 201 });
  console.log(`Registered user: ${TEST_USER_EMAIL}`);
  sleep(1);

  // 2. Login the test user to get an auth token
  let loginPayload = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };
  let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Auth_Login' },
  });
  check(loginRes, { 'user logged in successfully': (r) => r.status === 200 && r.json('tokens.accessToken') !== undefined });

  AUTH_TOKEN = loginRes.json('tokens.accessToken');
  console.log('User logged in, got token.');
  sleep(1);

  // 3. Create a project for the test user to get a project ID and API Key
  let createProjectPayload = {
    name: TEST_PROJECT_NAME,
    description: TEST_PROJECT_DESCRIPTION,
  };
  let createProjectRes = http.post(`${BASE_URL}/projects`, JSON.stringify(createProjectPayload), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    tags: { name: 'Project_Create' },
  });
  check(createProjectRes, { 'project created successfully': (r) => r.status === 201 && r.json('id') !== undefined && r.json('api_key') !== undefined });

  PROJECT_ID = createProjectRes.json('id');
  API_KEY = createProjectRes.json('api_key');
  console.log(`Project created: ${TEST_PROJECT_NAME}, ID: ${PROJECT_ID}, API Key: ${API_KEY}`);
  sleep(1);

  console.log('--- K6 Test Setup Finished ---');

  return { token: AUTH_TOKEN, projectId: PROJECT_ID, apiKey: API_KEY };
}

export default function (data) {
  // Ingest metric data (simulating monitored application)
  const metricType = 'http_request';
  const timestamp = new Date().toISOString();
  const durationMs = Math.floor(Math.random() * 500) + 50; // 50-550ms
  const status = Math.random() < 0.9 ? 200 : 500; // 90% success, 10% error

  let ingestPayload = {
    metricType: metricType,
    timestamp: timestamp,
    data: {
      url: `/api/data/${Math.floor(Math.random() * 10)}`,
      method: 'GET',
      durationMs: durationMs,
      status: status,
      resourceType: 'api_call',
    },
  };

  let ingestRes = http.post(`${BASE_URL}/metrics/ingest`, JSON.stringify(ingestPayload), {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': data.apiKey,
    },
    tags: { name: 'Metric_Ingest' },
  });
  check(ingestRes, {
    'metric ingested successfully': (r) => r.status === 201,
  });
  sleep(0.5); // Half a second between ingestions for each VU

  // Query aggregated metrics (simulating dashboard load)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  let queryAggregatedRes = http.get(
    `${BASE_URL}/metrics/${data.projectId}/aggregated?metricType=http_request&field=durationMs&aggregationType=avg&startTime=${oneHourAgo.toISOString()}&endTime=${now.toISOString()}&interval=minute`,
    {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
      tags: { name: 'Metric_QueryAggregated' },
    }
  );
  check(queryAggregatedRes, {
    'aggregated metrics retrieved successfully': (r) => r.status === 200,
  });
  sleep(1); // One second between aggregated queries for each VU

  // Query raw metrics (simulating drill-down)
  let queryRawRes = http.get(
    `${BASE_URL}/metrics/${data.projectId}?metricType=http_request&startTime=${oneHourAgo.toISOString()}&endTime=${now.toISOString()}&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
      tags: { name: 'Metric_QueryRaw' },
    }
  );
  check(queryRawRes, {
    'raw metrics retrieved successfully': (r) => r.status === 200,
  });
  sleep(0.5); // Half a second between raw queries for each VU
}

export function teardown(data) {
  console.log('--- K6 Test Teardown Started ---');

  // Clean up: Delete the created project
  let deleteProjectRes = http.del(`${BASE_URL}/projects/${data.projectId}`, null, {
    headers: {
      'Authorization': `Bearer ${data.token}`,
    },
    tags: { name: 'Project_Delete' },
  });
  check(deleteProjectRes, { 'project deleted successfully': (r) => r.status === 204 });
  console.log(`Project ${data.projectId} deleted.`);

  // Note: We don't delete the user because we might want to manually inspect,
  // or a real system might not allow self-deletion this easily.
  // In a truly isolated test, you'd delete the user as well.

  console.log('--- K6 Test Teardown Finished ---');
}
```
*Note: To run K6, you'll need the `wait-for-it.sh` script to be available in the Docker containers or manually ensure the backend is up. For local K6, simply run `k6 run k6-performance-test.js` after `docker-compose up` is fully complete.*