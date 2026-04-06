import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://js.k6.io/k6-summary/0.0.1/index.js";

// Backend API URL
const BASE_URL = 'http://localhost:5000/api';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate ramp-up to 20 users over 30s
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down to 0 users over 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be below 500ms, 99% below 1s
    http_req_failed: ['rate<0.01'],                 // less than 1% of requests should fail
  },
  summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)'],
};

export default function () {
  let authToken = '';
  let dbConnectionId = '';

  // 1. User Registration (Only once per test run, or use an existing user)
  if (__VU === 1 && __ITER === 0) { // Only first virtual user, first iteration
    const registerPayload = {
      username: `k6user_${__VU}`,
      email: `k6user_${__VU}@example.com`,
      password: 'k6password',
    };
    let res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(registerPayload), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Auth_Register' },
    });
    check(res, {
      'register status is 201': (r) => r.status === 201 || r.status === 409, // Allow 409 if already exists
      'register token exists': (r) => r.json() && r.json().data && r.json().data.token,
    });
    sleep(1);
  }

  // 2. User Login
  const loginPayload = {
    username: `k6user_${__VU}`,
    password: 'k6password',
  };
  let res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Auth_Login' },
  });
  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login token exists': (r) => r.json() && r.json().data && r.json().data.token,
  });
  authToken = res.json().data.token;
  sleep(1);

  if (authToken) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    // 3. Get Dashboard Summary (High traffic endpoint)
    res = http.get(`${BASE_URL}/dashboard/summary`, { headers, tags: { name: 'Dashboard_Summary' } });
    check(res, {
      'dashboard summary status is 200': (r) => r.status === 200,
      'dashboard summary data exists': (r) => r.json() && r.json().data,
    });
    sleep(1);

    // 4. Get all DB Connections (Moderate traffic)
    res = http.get(`${BASE_URL}/databases`, { headers, tags: { name: 'Get_DB_Connections' } });
    check(res, {
      'get db connections status is 200': (r) => r.status === 200,
      'get db connections data is array': (r) => Array.isArray(r.json().data),
    });
    if (res.json().data && res.json().data.length > 0) {
      dbConnectionId = res.json().data[0].id;
    }
    sleep(1);

    // 5. Create a DB Connection (Low traffic - once per VU for setup)
    if (__ITER === 0 && !dbConnectionId) { // Only first iteration and if no existing connection
        const createDbPayload = {
            name: `k6_db_${__VU}`,
            type: 'postgresql',
            host: 'mock_host', // Mock host as we don't connect to external DB here
            port: 5432,
            username: 'mock_user',
            password: 'mock_password',
            database: 'mock_db',
        };
        res = http.post(`${BASE_URL}/databases`, JSON.stringify(createDbPayload), {
            headers,
            tags: { name: 'Create_DB_Connection' },
        });
        check(res, {
            'create db status is 201': (r) => r.status === 201 || r.status === 409, // Allow 409 if exists
            'create db id exists': (r) => r.json() && r.json().data && r.json().data.id,
        });
        if (res.json().data && res.json().data.id) {
            dbConnectionId = res.json().data.id;
        }
        sleep(1);
    }

    // 6. Get Metrics for a specific connection (Moderate to High traffic if dashboard is detailed)
    if (dbConnectionId) {
        res = http.get(`${BASE_URL}/dashboard/${dbConnectionId}/metrics?period=24h`, { headers, tags: { name: 'Get_Connection_Metrics' } });
        check(res, {
            'get metrics status is 200': (r) => r.status === 200,
            'get metrics data is array': (r) => Array.isArray(r.json().data),
        });
        sleep(1);

        // 7. Get Recommendations for a specific connection (Moderate traffic)
        res = http.get(`${BASE_URL}/databases/${dbConnectionId}/recommendations`, { headers, tags: { name: 'Get_Recommendations' } });
        check(res, {
            'get recommendations status is 200': (r) => r.status === 200,
            'get recommendations data is array': (r) => Array.isArray(r.json().data),
        });
        sleep(1);
    }
  }
}

export function handleSummary(data) {
    return {
      "result.html": htmlReport(data),
      "stdout": textSummary(data, { indent: " ", enableColors: true }),
    };
}