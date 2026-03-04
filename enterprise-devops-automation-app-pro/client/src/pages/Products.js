import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../api/productService';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        setProducts(response.data.data.products);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center text-xl mt-10">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  }

  return (
    <div className="py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <p className="text-center text-gray-600 col-span-full">No products found.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105">
              <Link to={`/products/${product.id}`}>
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 truncate mb-2">{product.name}</h2>
                <p className="text-gray-600 text-lg font-bold mb-3">${product.price}</p>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description || 'No description available.'}</p>
                <Link to={`/products/${product.id}`} className="btn btn-primary w-full text-center">
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Products;