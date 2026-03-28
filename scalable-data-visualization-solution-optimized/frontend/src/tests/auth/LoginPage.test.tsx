import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import LoginPage from '../../pages/LoginPage';
import '@testing-library/jest-dom';
import * as api from '../../api/api';

// Mock the API calls
jest.mock('../../api/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('LoginPage', () => {
  const renderLoginPage = () =>
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with username and password fields', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  test('displays validation errors for empty fields on submit', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  test('calls login API and redirects on successful login', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        token: 'mock-jwt-token',
        username: 'testuser',
        roles: ['USER'],
      },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/authenticate', {
        username: 'testuser',
        password: 'password123',
      });
      // In a real test, you'd assert navigation using 'history' mock or a specific DOM change.
      // For this example, we'll just check API call.
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(localStorage.getItem('username')).toBe('testuser');
      expect(localStorage.getItem('roles')).toBe(JSON.stringify(['USER']));
    });
  });

  test('displays error message on failed login', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

### 5. **Documentation**

#### `README.md`
```markdown