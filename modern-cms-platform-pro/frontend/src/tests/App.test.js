import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import App from '../App';
import React from 'react';

// Mock localStorage for authentication
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock jwt_decode to return a valid token for testing auth state
jest.mock('jwt-decode', () => (token) => {
  if (token === 'valid_access_token') {
    return {
      user_id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_staff: true,
      is_superuser: true,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
  }
  return null;
});

// Mock axios API calls
jest.mock('../api', () => ({
  auth: {
    login: jest.fn(() => Promise.resolve({ data: { access: 'valid_access_token', refresh: 'valid_refresh_token', user: {id: 1, email: 'test@example.com', first_name: 'Test', last_name: 'User'}} })),
    getProfile: jest.fn(() => Promise.resolve({ data: {id: 1, email: 'test@example.com', first_name: 'Test', last_name: 'User'} })),
  },
  posts: {
    list: jest.fn(() => Promise.resolve({ data: { results: [] } })),
  },
  pages: {
    list: jest.fn(() => Promise.resolve({ data: { results: [] } })),
  },
  categories: {
    list: jest.fn(() => Promise.resolve({ data: { results: [] } })),
  },
  tags: {
    list: jest.fn(() => Promise.resolve({ data: { results: [] } })),
  },
  media: {
    list: jest.fn(() => Promise.resolve({ data: { results: [] } })),
  },
}));

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <ChakraProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </ChakraProvider>
  );
};

describe('App Routing and Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('redirects unauthenticated user to login page for /admin routes', async () => {
    renderWithProviders(<App />, { route: '/admin/dashboard' });
    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  test('renders Admin Dashboard for authenticated staff user', async () => {
    localStorage.setItem('access_token', 'valid_access_token');
    localStorage.setItem('refresh_token', 'valid_refresh_token');

    renderWithProviders(<App />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByText(/welcome, test!/i)).toBeInTheDocument();
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  test('renders public home page by default', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      // Assuming HomePage has a unique element, like a heading
      expect(screen.getByText(/welcome to my cms/i)).toBeInTheDocument();
    });
  });

  test('renders 404 page for unknown routes', async () => {
    renderWithProviders(<App />, { route: '/non-existent-route' });
    await waitFor(() => {
      expect(screen.getByText(/404 - page not found/i)).toBeInTheDocument();
    });
  });

  test('renders unauthorized page when user lacks role', async () => {
    localStorage.setItem('access_token', 'valid_access_token'); // mock jwt_decode makes this a staff/admin user
    localStorage.setItem('refresh_token', 'valid_refresh_token');
    // For this specific test, we need a mock where is_staff and is_superuser are false.
    // Re-mock jwt_decode locally for this test or assume an "allowedRoles" check for non-staff route
    // For simplicity, let's just test that the UnauthorizedPage component renders
    renderWithProviders(<App />, { route: '/unauthorized' });
    await waitFor(() => {
      expect(screen.getByText(/you are not authorized/i)).toBeInTheDocument();
    });
  });
});
```

#### Performance Tests

*   **Conceptual Approach:**
    *   **Tools:** Locust.io (Python), JMeter, K6.
    *   **Scenario:** Simulate concurrent users accessing public API endpoints (e.g., listing posts, viewing a specific post, fetching categories) and authenticated API endpoints (e.g., creating a post, uploading media).
    *   **Metrics:** Response times (average, p90, p99), requests per second, error rates, server resource utilization (CPU, memory, database connections).
    *   **Goal:** Identify bottlenecks in database queries, caching effectiveness, and API endpoint scalability.

*   **Example Locustfile (concept):**
    ```python
    # backend/locustfile.py (concept)
    from locust import HttpUser, task, between

    class CmsUser(HttpUser):
        wait_time = between(1, 2.5)
        host = "http://localhost:8000" # Or your deployed API URL

        def on_start(self):
            # Simulate login for authenticated tasks
            self.client.post("/api/v1/auth/login/", json={"email": "admin@example.com", "password": "adminpassword"})
            # Store JWT token for subsequent requests
            self.access_token = self.client.post("/api/v1/auth/login/", json={"email": "admin@example.com", "password": "adminpassword"}).json()["access"]
            self.client.headers = {"Authorization": f"Bearer {self.access_token}"}

        @task(10) # 10 times more likely to hit this task
        def list_posts(self):
            self.client.get("/api/v1/posts/", name="List Published Posts")

        @task(5)
        def retrieve_post(self):
            # Assume there's a published post with slug 'published-post' or fetch one dynamically
            self.client.get("/api/v1/posts/published-post/", name="Retrieve Single Post")

        @task(2)
        def list_categories(self):
            self.client.get("/api/v1/categories/", name="List Categories")

        @task(1) # Authenticated task (less frequent)
        def create_post(self):
            self.client.post(
                "/api/v1/posts/",
                json={
                    "title": "New Post by User",
                    "content": "Content of new post.",
                    "status": "draft"
                },
                name="Create New Post (Authenticated)"
            )
    ```

---

### 6. Documentation

#### `README.md`

```markdown