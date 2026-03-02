import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ProductsPage from '../../src/pages/ProductsPage';
import { AuthContext } from '../../src/context/AuthContext';
import { productApiService } from '../../src/services/product.service';
import '@testing-library/jest-dom';

// Mock productApiService
jest.mock('../../src/services/product.service', () => ({
  productApiService: {
    getProducts: jest.fn(),
    deleteProduct: jest.fn(),
  },
}));

// Mock AuthContext values
const authenticatedAuthContext = {
  user: { id: 'user123' },
  token: 'mock-auth-token',
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

describe('ProductsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading message initially', () => {
    productApiService.getProducts.mockReturnValueOnce(new Promise(() => {})); // Never resolve
    render(
      <AuthContext.Provider value={authenticatedAuthContext}>
        <Router>
          <ProductsPage />
        </Router>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('renders products when fetched successfully', async () => {
    const mockProducts = [
      { id: 'prod1', name: 'Laptop', description: 'A laptop', price: 1200.00, stock: 10 },
      { id: 'prod2', name: 'Mouse', description: 'A mouse', price: 25.50, stock: 50 },
    ];
    productApiService.getProducts.mockResolvedValueOnce(mockProducts);

    render(
      <AuthContext.Provider value={authenticatedAuthContext}>
        <Router>
          <ProductsPage />
        </Router>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('My Products')).toBeInTheDocument();
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Mouse')).toBeInTheDocument();
      expect(screen.getByText('Stock: 10')).toBeInTheDocument();
      expect(screen.getByText('$1,200.00')).toBeInTheDocument();
      expect(productApiService.getProducts).toHaveBeenCalledWith('mock-auth-token');
    });
  });

  it('renders error message when fetching products fails', async () => {
    productApiService.getProducts.mockRejectedValueOnce({ response: { data: { message: 'Network error' } } });

    render(
      <AuthContext.Provider value={authenticatedAuthContext}>
        <Router>
          <ProductsPage />
        </Router>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders "No products found" message when product list is empty', async () => {
    productApiService.getProducts.mockResolvedValueOnce([]);

    render(
      <AuthContext.Provider value={authenticatedAuthContext}>
        <Router>
          <ProductsPage />
        </Router>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('No products found. Start by adding a new one!')).toBeInTheDocument();
    });
  });

  it('calls deleteProduct and refreshes the list on delete button click', async () => {
    const mockProducts = [
      { id: 'prod1', name: 'Laptop', description: 'A laptop', price: 1200.00, stock: 10 },
    ];
    productApiService.getProducts.mockResolvedValueOnce(mockProducts); // Initial fetch
    productApiService.deleteProduct.mockResolvedValueOnce();
    // Simulate refetch after delete
    productApiService.getProducts.mockResolvedValueOnce([]);

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <AuthContext.Provider value={authenticatedAuthContext}>
        <Router>
          <ProductsPage />
        </Router>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?');

    await waitFor(() => {
      expect(productApiService.deleteProduct).toHaveBeenCalledWith('prod1', 'mock-auth-token');
      expect(productApiService.getProducts).toHaveBeenCalledTimes(2); // Initial fetch + refetch
      expect(screen.queryByText('Laptop')).not.toBeInTheDocument(); // Product should be gone
      expect(screen.getByText('No products found. Start by adding a new one!')).toBeInTheDocument();
    });
  });

  it('does not delete product if confirm is cancelled', async () => {
    const mockProducts = [
      { id: 'prod1', name: 'Laptop', description: 'A laptop', price: 1200.00, stock: 10 },
    ];
    productApiService.getProducts.mockResolvedValueOnce(mockProducts);
    window.confirm = jest.fn(() => false); // User cancels

    render(
      <AuthContext.Provider value={authenticatedAuthContext}>
        <Router>
          <ProductsPage />
        </Router>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?');
    expect(productApiService.deleteProduct).not.toHaveBeenCalled();
    expect(productApiService.getProducts).toHaveBeenCalledTimes(1); // No refetch if not deleted
    expect(screen.getByText('Laptop')).toBeInTheDocument(); // Product should still be there
  });
});
```
```