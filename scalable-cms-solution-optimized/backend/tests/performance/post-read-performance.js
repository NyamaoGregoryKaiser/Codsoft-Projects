import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

// This is a minimal k6 script for performance testing.
// For a real scenario, you would parameterize URLs, data, and authentication tokens.

// Load environment variables for the test run
// k6 run --env BASE_URL=http://localhost:5000 --env ADMIN_EMAIL=admin@example.com --env ADMIN_PASSWORD=admin123 backend/tests/performance/post-read-performance.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123';

// Performance test options
export let options = {
  stages: [
    { duration: '30s', target: 20 }, // Warm-up stage: 30s ramping up to 20 VUs
    { duration: '1m', target: 20 },  // Steady-state stage: 1m at 20 VUs
    { duration: '15s', target: 0 },  // Cool-down stage: 15s ramping down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be <500ms, 99% <1000ms
    http_req_failed: ['rate<0.01'],                  // http errors should be less than 1%
  },
  vus: 1, // Start with 1 VU to get auth token
};

// Store the admin token for all VUs once generated
const adminAuth = new SharedArray('adminAuth', function () {
  let token = null;
  // This block runs once per k6 process, not per VU
  try {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(loginRes, {
      'login successful': (resp) => resp.status === 200,
      'token received': (resp) => resp.json() && resp.json().token !== undefined,
    });

    token = loginRes.json().token;
  } catch (e) {
    console.error(`Failed to get admin token: ${e}`);
    // If login fails, subsequent requests will also fail.
    // k6 will report errors.
  }
  return [{ token: token }];
});

// The main default function for k6
export default function () {
  const token = adminAuth[0].token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  group('Post List Retrieval', function () {
    let res = http.get(`${BASE_URL}/api/posts?page=1&limit=10`, { headers });
    check(res, {
      'get posts status is 200': (r) => r.status === 200,
      'get posts has data': (r) => r.json().data && r.json().data.length > 0,
    });
    sleep(1); // Simulate user think time
  });

  group('Single Post Retrieval (by ID)', function () {
    // Assuming you have some post IDs from your test data or previous API calls.
    // For a real test, dynamically get an ID from the list retrieval or use a known one.
    const postId = 'post-id-1'; // Replace with a real ID from your seeded data or a dynamic fetch
    let res = http.get(`${BASE_URL}/api/posts/${postId}`, { headers });
    check(res, {
      'get single post status is 200': (r) => r.status === 200,
      'get single post has content': (r) => r.json().post && r.json().post.content.length > 0,
    });
    sleep(1);
  });

  group('Single Post Retrieval (by Slug)', function () {
    const postSlug = 'admin-created-post'; // Replace with a real slug
    let res = http.get(`${BASE_URL}/api/posts/${postSlug}`, { headers });
    check(res, {
      'get single post by slug status is 200': (r) => r.status === 200,
      'get single post by slug has content': (r) => r.json().post && r.json().post.content.length > 0,
    });
    sleep(1);
  });
}

```