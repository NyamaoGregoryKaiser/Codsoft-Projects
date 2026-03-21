import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

function ProductCard({ product }) {
  const { addItemToCart } = useCart();

  const handleAddToCart = () => {
    addItemToCart(product);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col justify-between">
      <Link to={`/products/${product.id}`} className="block">
        <img
          src={product.imageUrl || 'https://via.placeholder.com/200?text=No+Image'}
          alt={product.name}
          className="w-full h-48 object-cover object-center"
        />
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-2">{product.category_name || 'Uncategorized'}</p>
          <p className="text-xl font-bold text-blue-700">${product.price.toFixed(2)}</p>
        </div>
      </Link>
      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;