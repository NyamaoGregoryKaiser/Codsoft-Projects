import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics
const successfulAuths = new Counter('successful_authentications');
const failedAuths = new Counter('failed_authentications');
const authErrorRate = new Rate('authentication_error_rate');

// Global options for the test
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    'successful_authentications': ['count>=100'], // At least 100 successful authentications
    'authentication_error_rate': ['rate<0.05'], // Authentication error rate should be less than 5%
  },
  ext: {
    loadimpact: {
      projectID: 3662584, // Replace with your k6 Cloud project ID if using
      name: "Auth System Load Test",
    },
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api/v1';

export default function () {
  const email = `testuser_${__VU}_${__ITER}@example.com`;
  const password = 'Password123';

  // 1. Register User
  let registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerRes, {
    'register status is 201': (r) => r.status === 201,
  }) || (authErrorRate.add(1), failedAuths.add(1));

  sleep(0.5); // Short pause between requests

  // 2. Login User
  let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login contains access token': (r) => r.json() && r.json().data.accessToken !== undefined,
    'login contains refresh token cookie': (r) => r.cookies.refreshToken !== undefined,
  });

  if (loginSuccess) {
    successfulAuths.add(1);
    const accessToken = loginRes.json().data.accessToken;
    const refreshToken = loginRes.cookies.refreshToken[0].value;

    // 3. Access Protected Profile Route
    let profileRes = http.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile contains user data': (r) => r.json() && r.json().data.email === email,
    }) || (authErrorRate.add(1), failedAuths.add(1));

    sleep(0.5);

    // 4. Logout User
    let logoutRes = http.post(`${BASE_URL}/auth/logout`, null, {
      cookies: {
        refreshToken: refreshToken,
      }
    });

    check(logoutRes, {
      'logout status is 200': (r) => r.status === 200,
    }) || (authErrorRate.add(1), failedAuths.add(1));

  } else {
    failedAuths.add(1);
    authErrorRate.add(1);
  }

  sleep(1); // Think time between iterations
}