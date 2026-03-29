```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from './ProductCard';
import { Product, ProductStatus } from '@/src/types';
import { useCart } from '@/src/contexts/CartContext'; // Mock this hook
import { Toaster } from 'react-hot-toast'; // Required for toast messages

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock Next.js Image component for simplicity in tests
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  );
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock the useCart hook
jest.mock('@/src/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockAddToCart = jest.fn();

const mockProduct: Product = {
  id: 'prod123',
  name: 'Test Product',
  description: 'This is a test product description.',
  price: 19.99,
  stock: 5,
  categoryId: 'cat456',
  imageUrl: 'http://example.com/test-product.jpg',
  status: ProductStatus.ACTIVE,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('ProductCard', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (useCart as jest.Mock).mockReturnValue({
      addToCart: mockAddToCart,
      isProductInCart: jest.fn(),
      updateCartItemQuantity: jest.fn(),
      cartItems: [],
      totalItems: 0,
      totalPrice: 0,
      clearCart: jest.fn(),
    });
    mockAddToCart.mockClear();
  });

  it('renders product details correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description.')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test Product' })).toHaveAttribute('src', mockProduct.imageUrl);
    expect(screen.getByRole('link', { name: /Test Product/i })).toHaveAttribute('href', `/products/${mockProduct.id}`);
  });

  it('calls addToCart when "Add to Cart" button is clicked', () => {
    render(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByRole('button', { name: /Add to Cart/i });
    fireEvent.click(addToCartButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('displays "Out of Stock" and disables button if stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0, status: ProductStatus.OUT_OF_STOCK };
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    const addToCartButton = screen.getByRole('button', { name: /Sold Out/i });
    expect(addToCartButton).toBeDisabled();
    expect(addToCartButton).toHaveTextContent('Sold Out');

    fireEvent.click(addToCartButton);
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it('displays "Out of Stock" and disables button if status is OUT_OF_STOCK', () => {
    const outOfStockProduct = { ...mockProduct, stock: 10, status: ProductStatus.OUT_OF_STOCK }; // Stock available but status says out of stock
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    const addToCartButton = screen.getByRole('button', { name: /Sold Out/i });
    expect(addToCartButton).toBeDisabled();

    fireEvent.click(addToCartButton);
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it('does not call addToCart when disabled button is clicked', () => {
    const disabledProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={disabledProduct} />);

    const addToCartButton = screen.getByRole('button', { name: /Sold Out/i });
    fireEvent.click(addToCartButton);

    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it('renders "No Image" placeholder if imageUrl is missing', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: undefined };
    render(<ProductCard product={productWithoutImage} />);

    expect(screen.getByText('No Image')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```