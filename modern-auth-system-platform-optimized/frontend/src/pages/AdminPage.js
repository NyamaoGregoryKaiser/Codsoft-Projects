```jsx
import React, { useEffect, useState } from 'react';
import authService from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || !user.accessToken) {
        setError('Authentication required.');
        setLoading(false);
        return;
      }

      try {
        // Fetch users
        const usersResponse = await authService.authorizedApi.get(`${API_BASE_URL}/users`);
        setUsers(usersResponse.data);

        // Fetch products (as admin can manage them)
        const productsResponse = await authService.authorizedApi.get(`${API_BASE_URL}/products`);
        setProducts(productsResponse.data);

      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        setError(err.response?.data?.message || 'Failed to fetch admin data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, API_BASE_URL]);

  if (loading) return <div className="text-center">Loading admin data...</div>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>

      <section className="mb-5">
        <h3>User Management</h3>
        {users.length > 0 ? (
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.firstName}</td>
                  <td>{u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{u.roles.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </section>

      <section>
        <h3>Product Management</h3>
        {products.length > 0 ? (
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>{p.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No products found.</p>
        )}
      </section>
    </div>
  );
}

export default AdminPage;
```