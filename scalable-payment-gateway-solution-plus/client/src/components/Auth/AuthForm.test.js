```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthForm from './AuthForm'; // Assume a generic AuthForm component for login/register
import { AuthProvider, useAuth } from '../../context/AuthContext'; // Mock useAuth
import '@testing-library/jest-dom';

// Mock the AuthContext for testing the component in isolation
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'), // Use actual for Provider, but mock useAuth
  useAuth: jest.fn(),
}));

// Helper component to provide mocked AuthContext value
const MockAuthWrapper = ({ children, mockAuthValue }) => {
  useAuth.mockReturnValue(mockAuthValue);
  return (
    <Router>
      {children}
    </Router>
  );
};

describe('AuthForm (Login Mode)', () => {
  const mockLogin = jest.fn();
  const mockAuthValue = {
    isAuthenticated: false,
    user: null,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(() => {
    mockLogin.mockClear();
    useAuth.mockClear(); // Clear mock before each test
  });

  it('renders login form correctly', () => {
    render(
      <MockAuthWrapper mockAuthValue={mockAuthValue}>
        <AuthForm type="login" />
      </MockAuthWrapper>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  });

  it('calls login function on submit with correct data', async () => {
    render(
      <MockAuthWrapper mockAuthValue={mockAuthValue}>
        <AuthForm type="login" />
      </MockAuthWrapper>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on failed login', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage)); // Simulate a login error

    render(
      <MockAuthWrapper mockAuthValue={mockAuthValue}>
        <AuthForm type="login" />
      </MockAuthWrapper>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    // Simulate a pending promise for loading state
    mockLogin.mockImplementation(() => new Promise(() => {}));

    render(
      <MockAuthWrapper mockAuthValue={mockAuthValue}>
        <AuthForm type="login" />
      </MockAuthWrapper>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging in.../i })).toBeDisabled(); // Assuming button text changes
    });
  });
});
```

#### Performance Tests (Conceptual)

Performance tests would typically involve tools like `k6` or `JMeter`. Here's a conceptual plan:

1.  **Identify Critical Endpoints:** Login, Register, Create Product, Get Products (paginated), Initiate Payment.
2.  **Define Load Scenarios:**
    *   **Smoke Test:** Small number of users (e.g., 5-10) for a short duration to verify basic functionality under load.
    *   **Load Test:** Gradually increase users to reach a peak (e.g., 500 concurrent users) to measure system performance under expected load.
    *   **Stress Test:** Push beyond expected load (e.g., 1000+ users) to find breaking points and observe resource utilization.
    *   **Soak Test:** Run for an extended period (e.g., 4-8 hours) with moderate load to detect memory leaks or resource exhaustion.
3.  **Metrics to Monitor:**
    *   Response Times (p50, p90, p95)
    *   Requests Per Second (RPS)
    *   Error Rate
    *   CPU/Memory Utilization (server, database)
    *   Database connection pool usage
4.  **Tools:**
    *   `k6`: For scripting and running tests. Example `k6` script for a login endpoint:
        ```javascript
        // k6_login_test.js
        import http from 'k6/http';
        import { check, sleep } from 'k6';

        export const options = {
          stages: [
            { duration: '30s', target: 20 }, // ramp up to 20 users
            { duration: '1m', target: 20 },  // stay at 20 users
            { duration: '30s', target: 0 },  // ramp down to 0 users
          ],
          thresholds: {
            http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
            http_req_failed: ['rate<0.01'],    // error rate should be below 1%
          },
        };

        export default function () {
          const url = 'http://localhost:5000/api/auth/login';
          const payload = JSON.stringify({
            email: 'customer@example.com', // Use a seed user
            password: 'password123',
          });

          const params = {
            headers: {
              'Content-Type': 'application/json',
            },
          };

          const res = http.post(url, payload, params);

          check(res, {
            'is status 200': (r) => r.status === 200,
            'has token': (r) => r.json() && r.json().token !== '',
          });

          sleep(1); // Simulate user think time
        }
        ```
    *   `Grafana/Prometheus`: For monitoring real-time metrics during tests.

---

### 5. Documentation

#### README.md (Comprehensive)