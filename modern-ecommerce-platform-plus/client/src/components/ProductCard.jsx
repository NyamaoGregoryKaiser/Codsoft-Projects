```javascript
// client/src/components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link to={`/products/${product.id}`}>
        <img
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          <Link to={`/products/${product.id}`} className="hover:text-blue-600">
            {product.name}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mt-1">{product.category}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            onClick={() => console.log('Add to cart:', product.id)} // Placeholder
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

```