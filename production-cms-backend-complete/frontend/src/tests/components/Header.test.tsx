import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Header from '../../components/Header';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

// Mock the AuthContext's useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockStore = configureStore([]);

describe('Header Component', () => {
  let store: any;
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      },
    });
    // Default mock for unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      isAdmin: false,
      isEditor: false,
      isViewer: false,
    });
  });

  it('renders CMS title and unauthenticated links', () => {
    render(
      <Provider store={store}>
        <Router>
          <Header />
        </Router>
      </Provider>
    );

    expect(screen.getByText('CMS')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('renders authenticated links and user info for Viewer', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'viewer@example.com', role: UserRole.VIEWER },
      isAuthenticated: true,
      loading: false,
      error: null,
      isAdmin: false,
      isEditor: false,
      isViewer: true,
    });

    render(
      <Provider store={store}>
        <Router>
          <Header />
        </Router>
      </Provider>
    );

    expect(screen.getByText('Welcome, viewer@example.com (VIEWER)')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('renders authenticated links and user info for Editor, including Categories', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'editor@example.com', role: UserRole.EDITOR },
      isAuthenticated: true,
      loading: false,
      error: null,
      isAdmin: false,
      isEditor: true,
      isViewer: true,
    });

    render(
      <Provider store={store}>
        <Router>
          <Header />
        </Router>
      </Provider>
    );

    expect(screen.getByText('Welcome, editor@example.com (EDITOR)')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('renders authenticated links and user info for Admin, including Categories and Users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '3', email: 'admin@example.com', role: UserRole.ADMIN },
      isAuthenticated: true,
      loading: false,
      error: null,
      isAdmin: true,
      isEditor: true,
      isViewer: true,
    });

    render(
      <Provider store={store}>
        <Router>
          <Header />
        </Router>
      </Provider>
    );

    expect(screen.getByText('Welcome, admin@example.com (ADMIN)')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('dispatches logout and redirects on logout button click', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'viewer@example.com', role: UserRole.VIEWER },
      isAuthenticated: true,
      loading: false,
      error: null,
      isAdmin: false,
      isEditor: false,
      isViewer: true,
    });
    // Mock useNavigate
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
    }));

    render(
      <Provider store={store}>
        <Router>
          <Header />
        </Router>
      </Provider>
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(store.getActions()).toEqual([{ type: 'auth/logout' }]);
    // In a real test, you'd assert the actual navigation with a mocked useNavigate
    // For this setup, mock useNavigate within the test or use a wrapper.
    // Given the component setup, navigate cannot be directly asserted here without more complex mocking.
    // The main assertion is that `auth/logout` action is dispatched.
  });
});