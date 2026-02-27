import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthContext } from '../auth/AuthContext';
import { vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignIn = vi.fn();

// Custom render function to wrap with AuthProvider (mocked) and BrowserRouter
const renderWithProviders = (ui, { providerProps, ...renderOptions } = {}) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ signIn: mockSignIn, ...providerProps }}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>,
    renderOptions
  );
};


describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with username and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows validation error for empty fields on submit', async () => {
    renderWithProviders(<LoginPage />);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    await act(async () => {
      fireEvent.click(loginButton);
    });

    expect(screen.getByText(/Please enter both username and password./i)).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn and navigates on successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });
    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });

  it('shows error message on failed login', async () => {
    mockSignIn.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });
    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('testuser', 'wrongpass');
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows spinner while logging in', async () => {
    mockSignIn.mockReturnValueOnce(new Promise(() => {})); // Simulate pending login
    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(screen.getByRole('button', { name: /Login/i })).toHaveAttribute('disabled');
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner usually has role status
  });
});
```

#### Performance Tests (JMeter - Description)

For performance testing, Apache JMeter would be used.
A typical JMeter test plan would include:

*   **Test Plan:** Root element.
*   **Thread Group:** Simulates users/load.
    *   Number of Threads (users): e.g., 100
    *   Ramp-up Period (seconds): e.g., 10 (100 users ramp up over 10 seconds)
    *   Loop Count: e.g., 5 (each user performs the scenario 5 times)
*   **HTTP Cookie Manager:** Manages cookies, simulating a browser.
*   **HTTP Header Manager:** Sets common headers (e.g., `Content-Type: application/json`, `Authorization: Bearer <token>`).
*   **User Defined Variables:** For API base URL, test user credentials.
*   **Login Flow (Sampler Group):**
    *   HTTP Request: `POST /api/v1/auth/login` (with username/password from CSV Data Set Config)
    *   JSON Extractor: Extracts the JWT token from the login response.
    *   Regex Extractor: (Alternative to JSON Extractor)
*   **Controller Flow (Sampler Group):** (Wrapped in Loop Controller, if simulating multiple project/task interactions)
    *   **Create Project:** `POST /api/v1/projects` (with dynamic data for name/description)
    *   **Get All Projects:** `GET /api/v1/projects`
    *   **Get Project by ID:** `GET /api/v1/projects/{id}` (extract ID from previous create or list)
    *   **Create Task:** `POST /api/v1/tasks`
    *   **Update Task:** `PUT /api/v1/tasks/{id}`
    *   **Delete Task/Project:** `DELETE` operations.
*   **Listeners:**
    *   **View Results Tree:** Detailed request/response.
    *   **Summary Report:** Overall statistics (throughput, errors).
    *   **Aggregate Report:** Response times, percentiles.
    *   **Graphs (e.g., Response Times Over Time, Throughput):** Visual trends.

**Key Metrics to Monitor:**
*   **Response Time:** Average, P90, P95, P99 latency.
*   **Throughput:** Requests per second.
*   **Error Rate:** Percentage of failed requests.
*   **Concurrency:** Number of active users.

**Example Scenarios:**
1.  **Concurrent Users Login & Browse:** Simulate many users logging in and fetching project lists.
2.  **CRUD Operations Load:** Simulate users performing create, read, update, delete operations on projects and tasks under load.
3.  **Specific Endpoint Stress Test:** Focus on a single critical endpoint (e.g., `GET /api/v1/projects/{id}`) with high concurrency.

***

### 5. Documentation

**`README.md`**
```markdown