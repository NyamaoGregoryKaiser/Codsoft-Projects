import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import productService from '../api/productService';
import { useAuth } from '../auth/AuthContext';

function ProductDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getProductById(id);
        setProduct(response.data.data.product);
      } catch (err) {
        setError('Failed to load product details.');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="text-center text-xl mt-10">Loading product...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  }

  if (!product) {
    return <div className="text-center text-xl mt-10">Product not found.</div>;
  }

  const isOwner = user && product.owner && user.id === product.owner.id;
  const canModify = isOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden md:flex">
        <div className="md:flex-shrink-0">
          <img
            className="h-64 w-full object-cover md:w-64"
            src={product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.name}
          />
        </div>
        <div className="p-8 flex-grow">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-gray-700 text-xl mb-6">${product.price}</p>
          <p className="text-gray-600 mb-6">{product.description || 'No description available.'}</p>
          <div className="mb-6">
            <span className="font-semibold text-gray-800">Stock:</span> {product.stock} units
          </div>
          <div className="mb-6">
            <span className="font-semibold text-gray-800">Added by:</span> {product.owner?.username || 'N/A'}
          </div>
          {canModify && (
            <div className="flex space-x-4">
              <Link to={`/products/edit/${product.id}`} className="btn btn-primary">
                Edit Product
              </Link>
              {/* Delete functionality could be added here, potentially with a modal confirmation */}
            </div>
          )}
          <Link to="/products" className="block mt-8 text-blue-600 hover:underline">
            ← Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;