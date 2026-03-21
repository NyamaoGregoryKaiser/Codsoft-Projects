import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as productApi from '../api/products';
import { useCart } from '../contexts/CartContext';

function ProductDetailPage() {
  const { productId } = useParams();
  const { addItemToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productApi.getProductById(productId);
        setProduct(response.data.data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Product not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addItemToCart(product, quantity);
      alert(`${quantity} of ${product.name} added to cart!`);
    }
  };

  if (loading) return <div className="text-center py-8">Loading product details...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-8">Product not found.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <img
            src={product.imageUrl || 'https://via.placeholder.com/400?text=No+Image'}
            alt={product.name}
            className="w-full h-auto object-cover rounded-lg shadow-md"
          />
        </div>
        <div className="md:w-1/2 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 text-lg mb-4">{product.category_name || 'Uncategorized'}</p>
            <p className="text-3xl font-bold text-blue-700 mb-6">${product.price.toFixed(2)}</p>
            <p className="text-gray-700 mb-6 leading-relaxed">{product.description || 'No description available.'}</p>
            <p className="text-gray-800 font-semibold mb-4">
              Availability: {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-auto">
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 p-2 border border-gray-300 rounded-md text-center"
              disabled={product.stock === 0}
            />
            <button
              onClick={handleAddToCart}
              className="flex-grow bg-blue-500 text-white py-3 px-6 rounded-md text-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;