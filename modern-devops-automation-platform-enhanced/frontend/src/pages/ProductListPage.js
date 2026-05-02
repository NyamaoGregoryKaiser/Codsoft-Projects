```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [isAuthenticated, navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/products');
      setProducts(response.data.rows); // Assuming API returns { count, rows: [...] }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productId) => {
    navigate(`/products/edit/${productId}`);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}`);
        fetchProducts(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  if (loading) {
    return <div className="container">Loading products...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h1>Products</h1>
      <Link to="/products/new">
        <button>Add New Product</button>
      </Link>
      {products.length === 0 ? (
        <p>No products available. Add one!</p>
      ) : (
        <div className="product-list">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductListPage;
```