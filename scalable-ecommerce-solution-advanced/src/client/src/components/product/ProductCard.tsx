import React from 'react';
import { Product } from '../../types';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    e.stopPropagation(); // Stop event propagation
    addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  };

  return (
    <Link 
      to={`/products/${product.id}`} 
      className="relative block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
    >
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-red-600 bg-opacity-75 text-white flex items-center justify-center text-xl font-bold z-10">
          Out of Stock
        </div>
      )}
      <div className="p-4">
        <img 
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
          alt={product.name} 
          className="w-full h-48 object-cover rounded-md mb-4 group-hover:scale-105 transition-transform duration-300" 
        />
        <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          <FaShoppingCart />
          <span>Add to Cart</span>
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;