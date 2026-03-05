import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. Init code
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';
const USER_EMAIL = __ENV.USER_EMAIL || 'admin@dbtune.com';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'adminpassword';

// Load connection IDs to test against
const connectionIds = new SharedArray('connection_ids', function () {
  // In a real scenario, you'd fetch these from your API or a config file
  // For demonstration, use a static list
  return [1, 2, 3]; // Replace with actual connection IDs from your setup
});

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Warm-up: 20 VUs for 30 seconds
    { duration: '1m', target: 50 },  // Steady-state: 50 VUs for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down: 0 VUs for 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
  },
  // No requests will be run if connectionIds is empty
  // Set connections = 1 if connectionIds is empty, otherwise connections.length
  ext: {
    loadimpact: {
      projectID: 3650630, // Replace with your k6 Cloud project ID
      name: 'DBTune API Load Test',
    },
  },
};

// Function to log in and get a JWT token
function getAuthToken(email, password) {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });

  check(loginRes, {
    'login successful': (resp) => resp.status === 200 && resp.json() && resp.json().token,
  });

  return loginRes.json().token;
}


export default function () {
  const authToken = getAuthToken(USER_EMAIL, USER_PASSWORD);

  if (!authToken) {
    console.error('Failed to get auth token. Aborting scenario.');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  // Test 1: Get Connections
  let res = http.get(`${BASE_URL}/connections`, { headers: headers, tags: { name: 'getConnections' } });
  check(res, {
    'getConnections status is 200': (r) => r.status === 200,
    'getConnections has data': (r) => r.json().length > 0,
  });
  sleep(1);

  // Test 2: Analyze a Query
  const randomConnId = connectionIds[Math.floor(Math.random() * connectionIds.length)];
  const queryToAnalyze = 'SELECT * FROM users WHERE id = 1;'; // Example query

  res = http.post(`${BASE_URL}/queries/analyze`, JSON.stringify({
    connectionId: randomConnId,
    query: queryToAnalyze,
  }), { headers: headers, tags: { name: 'analyzeQuery' } });

  check(res, {
    'analyzeQuery status is 200': (r) => r.status === 200,
    'analyzeQuery has planJson': (r) => r.json() && r.json().planJson,
  });
  sleep(2);

  // Test 3: Get Live Metrics for a connection
  res = http.get(`${BASE_URL}/metrics/${randomConnId}/live`, { headers: headers, tags: { name: 'getLiveMetrics' } });
  check(res, {
    'getLiveMetrics status is 200': (r) => r.status === 200,
    'getLiveMetrics has active_connections': (r) => r.json() && typeof r.json().active_connections === 'number',
  });
  sleep(1);

  // Test 4: Get Tables for a connection
  const dummySchema = 'public'; // Assuming 'public' schema
  res = http.get(`${BASE_URL}/schema/${randomConnId}/tables`, { headers: headers, tags: { name: 'getTables' } });
  check(res, {
    'getTables status is 200': (r) => r.status === 200,
    'getTables returns array': (r) => Array.isArray(r.json()),
  });
  sleep(1);

  // More complex scenarios can be added here, e.g., chaining requests, error handling.
}
```

---

### **5. Documentation**

**`README.md` (Root of the project)**
```markdown