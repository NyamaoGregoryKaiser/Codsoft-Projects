```javascript
// client/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/products';
import { toast } from 'react-toastify';
import { StarIcon } from '@heroicons/react/20/solid'; // Example icon

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Failed to fetch product');
        toast.error('Failed to load product details.');
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-8">Loading product details...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!product) return <div className="text-center py-8">Product not found.</div>;

  const handleAddToCart = () => {
    // Implement add to cart logic here
    toast.success(`${product.name} added to cart!`);
    console.log('Adding to cart:', product.id);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
        &larr; Back to Products
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden md:flex">
        <div className="md:w-1/2">
          <img
            src={product.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image'}
            alt={product.name}
            className="w-full h-96 object-contain p-4"
          />
        </div>
        <div className="md:w-1/2 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-600 text-lg mb-4">{product.category} - {product.brand}</p>
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`h-5 w-5 ${i < 4 ? 'text-yellow-500' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="ml-2 text-gray-600">(4.0 / 5)</span> {/* Placeholder for rating */}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-6">${product.price.toFixed(2)}</p>
          <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center space-x-4 mb-6">
            <span className="text-gray-800 font-semibold">Stock:</span>
            {product.stock > 0 ? (
              <span className="text-green-600">{product.stock} in stock</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-200 ${
              product.stock > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

```