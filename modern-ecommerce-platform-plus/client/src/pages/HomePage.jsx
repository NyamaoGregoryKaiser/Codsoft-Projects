```javascript
// client/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-toastify';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { products } = await getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }); // Fetch latest 8 products
        setProducts(products);
      } catch (err) {
        setError('Failed to fetch products');
        toast.error('Failed to load products. Please try again later.');
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Welcome to E-Shop!</h1>
      <p className="text-center text-gray-600 mb-8">Discover our latest collection.</p>

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && <p className="text-center text-gray-500">No products found.</p>}
    </div>
  );
};

export default HomePage;

```