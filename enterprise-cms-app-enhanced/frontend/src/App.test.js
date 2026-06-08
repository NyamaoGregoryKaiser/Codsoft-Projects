import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom components to prevent actual navigation errors in tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
  Outlet: () => <div data-testid="outlet" />,
}));

// Mock AuthProvider and useAuth hook
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    hasRole: jest.fn(() => false),
  }),
}));


describe('App Component', () => {
  it('renders home page and login/register links when not authenticated', () => {
    render(<App />);
    expect(screen.getByText(/welcome to the cms/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
  });
});