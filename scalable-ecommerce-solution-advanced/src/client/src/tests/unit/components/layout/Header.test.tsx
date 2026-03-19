import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from '../../../../components/layout/Header';
import { AuthContext, AuthState } from '../../../../context/AuthContext';
import { CartContext } from '../../../../context/CartContext';
import { User } from '../../../../types';

// Mock the AuthContext and CartContext
const mockAuthContext = (authState: AuthState, overrides?: Partial<AuthContext>) => ({
  user: authState.user,
  tokens: authState.tokens,
  isAuthenticated: authState.isAuthenticated,
  isLoading: authState.isLoading,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  ...overrides,
});

const mockCartContext = (itemCount: number, overrides?: Partial<CartContext>) => ({
  cartItems: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getCartTotal: jest.fn(() => 0),
  getCartItemCount: jest.fn(() => itemCount),
  ...overrides,
});

const renderWithContext = (
  authState: AuthState,
  cartItemCount: number = 0,
  authOverrides?: Partial<AuthContext>,
  cartOverrides?: Partial<CartContext>
) => {
  return render(
    <Router>
      <AuthContext.Provider value={mockAuthContext(authState, authOverrides)}>
        <CartContext.Provider value={mockCartContext(cartItemCount, cartOverrides)}>
          <Header />
        </CartContext.Provider>
      </AuthContext.Provider>
    </Router>
  );
};

describe('Header Component', () => {
  it('renders E-Shop title and basic navigation links', () => {
    renderWithContext({ user: null, tokens: null, isAuthenticated: false, isLoading: false });

    expect(screen.getByText('E-Shop')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
  });

  it('shows Login and Register links when not authenticated', () => {
    renderWithContext({ user: null, tokens: null, isAuthenticated: false, isLoading: false });

    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
  });

  it('shows Logout and user name when authenticated as a regular user', () => {
    const mockUser: User = { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', role: 'user' };
    renderWithContext({ user: mockUser, tokens: { accessToken: 'abc', refreshToken: 'def' }, isAuthenticated: true, isLoading: false });

    expect(screen.getByText(/Hello, John/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Admin/i })).not.toBeInTheDocument();
  });

  it('shows Admin link when authenticated as an admin user', () => {
    const mockAdmin: User = { id: '2', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: 'admin' };
    renderWithContext({ user: mockAdmin, tokens: { accessToken: 'abc', refreshToken: 'def' }, isAuthenticated: true, isLoading: false });

    expect(screen.getByRole('link', { name: /Admin/i })).toBeInTheDocument();
  });

  it('calls logout function when Logout button is clicked', () => {
    const mockUser: User = { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', role: 'user' };
    const mockLogout = jest.fn();
    renderWithContext(
      { user: mockUser, tokens: { accessToken: 'abc', refreshToken: 'def' }, isAuthenticated: true, isLoading: false },
      0,
      { logout: mockLogout }
    );

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays cart item count correctly', () => {
    renderWithContext({ user: null, tokens: null, isAuthenticated: false, isLoading: false }, 5);

    const cartLink = screen.getByRole('link', { name: /Cart/i });
    expect(cartLink).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // The badge with count
  });

  it('does not display cart item count if zero', () => {
    renderWithContext({ user: null, tokens: null, isAuthenticated: false, isLoading: false }, 0);

    const cartLink = screen.getByRole('link', { name: /Cart/i });
    expect(cartLink).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(cartLink.querySelector('span')).not.toBeInTheDocument(); // No badge
  });
});
```