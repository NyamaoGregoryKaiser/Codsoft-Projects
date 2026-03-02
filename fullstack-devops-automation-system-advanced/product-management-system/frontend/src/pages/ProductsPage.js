import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { productApiService } from '../services/product.service';
import ProductCard from '../components/ProductCard';
import '../App.css'; // For product page styles

function ProductsPage() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await productApiService.getProducts(token);
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productApiService.deleteProduct(id, token);
        // Refresh products after deletion
        fetchProducts();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  if (loading) {
    return <div className="loading-message">Loading products...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <h2>My Products</h2>
        <Link to="/products/new" className="btn btn-primary">Add New Product</Link>
      </div>
      {products.length === 0 ? (
        <div className="empty-message">No products found. Start by adding a new one!</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
```

```