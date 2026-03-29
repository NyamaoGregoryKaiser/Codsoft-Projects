```typescript
import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-gray-300 py-8 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">E-Shop</h3>
          <p className="text-sm">
            Your one-stop shop for all your needs. Quality products, unbeatable prices.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
          <ul>
            <li className="mb-2"><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li className="mb-2"><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            <li className="mb-2"><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li className="mb-2"><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Shop</h4>
          <ul>
            <li className="mb-2"><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
            <li className="mb-2"><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
            <li className="mb-2"><Link href="/cart" className="hover:text-primary transition-colors">My Cart</Link></li>
            <li className="mb-2"><Link href="/orders" className="hover:text-primary transition-colors">My Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
          <p className="text-sm mb-2">123 E-commerce St, Suite 456</p>
          <p className="text-sm mb-2">Shopville, ST 98765</p>
          <p className="text-sm mb-2">Email: info@eshop.com</p>
          <p className="text-sm">Phone: (123) 456-7890</p>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
        &copy; {new Date().getFullYear()} E-Shop. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
```