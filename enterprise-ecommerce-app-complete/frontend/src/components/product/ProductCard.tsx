```typescript
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/src/types';
import { useCart } from '@/src/contexts/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail page
    e.stopPropagation(); // Stop event propagation
    addToCart(product, 1);
  };

  const isOutOfStock = product.stock === 0 || product.status === 'OUT_OF_STOCK';

  return (
    <Link href={`/products/${product.id}`} className="block group border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
      <div className="relative w-full h-48 sm:h-56 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 group-hover:scale-105"
            priority={true} // Prioritize loading for initial products
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
            <span className="text-sm">No Image</span>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
            Out of Stock
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col h-[calc(100%-12rem)] sm:h-[calc(100%-14rem)]"> {/* Adjust height based on image size */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>
        <div className="flex justify-between items-center mt-auto pt-2">
          <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200
              ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-red-600 active:scale-95'}
            `}
          >
            <ShoppingCartIcon className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
```