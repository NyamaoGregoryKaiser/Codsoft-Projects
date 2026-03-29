```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isProductInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('ecommerce_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart data from localStorage:', error);
        localStorage.removeItem('ecommerce_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('ecommerce_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            toast.error(`Cannot add more than available stock (${product.stock}) for ${product.name}.`);
            return prevItems;
        }
        toast.success(`Updated quantity for ${product.name} in cart!`);
        return prevItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item to cart
        if (quantity > product.stock) {
            toast.error(`Cannot add more than available stock (${product.stock}) for ${product.name}.`);
            return prevItems;
        }
        toast.success(`Added ${product.name} to cart!`);
        return [
          ...prevItems,
          {
            id: Date.now().toString(), // Simple unique ID for frontend cart items
            productId: product.id,
            product: product, // Store full product details for convenience
            quantity,
            price: product.price,
          },
        ];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => {
      const removedItem = prevItems.find(item => item.productId === productId);
      if (removedItem) {
        toast.success(`Removed ${removedItem.product.name} from cart.`);
      }
      return prevItems.filter(item => item.productId !== productId)
    });
  }, []);

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
      const itemToUpdate = prevItems.find(item => item.productId === productId);
      if (!itemToUpdate) return prevItems;

      if (quantity <= 0) {
        toast.success(`Removed ${itemToUpdate.product.name} from cart.`);
        return prevItems.filter(item => item.productId !== productId);
      }
      if (quantity > itemToUpdate.product.stock) {
        toast.error(`Cannot set quantity more than available stock (${itemToUpdate.product.stock}) for ${itemToUpdate.product.name}.`);
        return prevItems;
      }
      toast.success(`Updated quantity for ${itemToUpdate.product.name}.`);
      return prevItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast('Cart cleared!', { icon: '🛒' });
  }, []);

  const isProductInCart = useCallback((productId: string) => {
    return cartItems.some(item => item.productId === productId);
  }, [cartItems]);

  const value = React.useMemo(() => ({
    cartItems,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    isProductInCart,
  }), [cartItems, totalItems, totalPrice, addToCart, removeFromCart, updateCartItemQuantity, clearCart, isProductInCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
```