import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Products from './Products';
import { AuthContext } from '../auth/AuthContext'; // Mocking AuthContext if needed for header/navigation

// Mock AuthContext for pages that might use it (e.g. for header)
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAdmin: false,
  handleLogout: jest.fn(),
  handleLogin: jest.fn(),
  handleRegister: jest.fn(),
  token: null,
};

describe('Products Page', () => {
  it('renders loading state initially then displays products', async () => {
    render(
      <Router>
        <AuthContext.Provider value={mockAuthContext}>
          <Products />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByText(/Loading products.../i)).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText(/Loading products.../i));

    expect(screen.getByText(/Our Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Laptop Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Wireless Mouse/i)).toBeInTheDocument();
    expect(screen.getByText('$1200')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
  });

  it('renders "No products found." message if no products are available', async () => {
    // Mock an empty products array
    jest.mock('../api/productService', () => ({
      getAllProducts: () => Promise.resolve({ data: { data: { products: [] } } }),
    }));

    render(
      <Router>
        <AuthContext.Provider value={mockAuthContext}>
          <Products />
        </AuthContext.Provider>
      </Router>
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/Loading products.../i));
    expect(screen.getByText(/No products found./i)).toBeInTheDocument();

    // Reset the mock for other tests
    jest.clearAllMocks();
    jest.unmock('../api/productService');
  });

  it('renders error message if fetching products fails', async () => {
    // Mock a rejected promise for getAllProducts
    jest.mock('../api/productService', () => ({
      getAllProducts: () => Promise.reject(new Error('Network error')),
    }));

    render(
      <Router>
        <AuthContext.Provider value={mockAuthContext}>
          <Products />
        </AuthContext.Provider>
      </Router>
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/Loading products.../i));
    expect(screen.getByText(/Failed to load products. Please try again later./i)).toBeInTheDocument();

    // Reset the mock for other tests
    jest.clearAllMocks();
    jest.unmock('../api/productService');
  });
});