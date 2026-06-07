```jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';

function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || !user.accessToken) {
        setError('Authentication required.');
        setLoading(false);
        return;
      }
      try {
        const response = await authService.authorizedApi.get(`${API_BASE_URL}/products`);
        setProducts(response.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err.response?.data?.message || 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, API_BASE_URL]);

  if (loading) return <div className="text-center">Loading products...</div>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <div>
      <h2 className="mb-4">Welcome to your Dashboard, {user?.email}!</h2>
      <p className="lead">Your roles: {user?.roles?.join(', ')}</p>

      <h3 className="mt-5">Available Products</h3>
      {products.length > 0 ? (
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stockQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No products available.</p>
      )}
    </div>
  );
}

export default DashboardPage;
```