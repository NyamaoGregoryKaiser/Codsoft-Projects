import React, { useState, useEffect } from 'react';
import * as api from './api'; // Import all API functions

function App() {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('user123');
  const [name, setName] = useState('Test User');
  const [message, setMessage] = useState('');
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || '');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (accessToken) {
      api.setAuthToken(accessToken);
    }
  }, [accessToken]);

  const handleAuthResponse = (res) => {
    setMessage(res.data.message);
    setAccessToken(res.data.data.accessToken);
    setRefreshToken(res.data.data.refreshToken);
    localStorage.setItem('accessToken', res.data.data.accessToken);
    localStorage.setItem('refreshToken', res.data.data.refreshToken);
  };

  const handleError = (error) => {
    console.error('API Error:', error.response?.data || error.message);
    setMessage(error.response?.data?.error?.message || error.message);
  };

  const handleRegister = async () => {
    try {
      const res = await api.register({ email, password, name });
      setMessage(res.data.message);
    } catch (error) {
      handleError(error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await api.login({ email, password });
      handleAuthResponse(res);
    } catch (error) {
      handleError(error);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await api.logout(refreshToken);
      setMessage(res.data.message);
      setAccessToken('');
      setRefreshToken('');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      api.setAuthToken(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleRefreshTokens = async () => {
    try {
      const res = await api.refreshTokens(refreshToken);
      handleAuthResponse(res);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.getAllProducts();
      setProducts(res.data.data.data);
      setMessage('Products fetched successfully!');
    } catch (error) {
      handleError(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getAllUsers();
      setUsers(res.data.data.data);
      setMessage('Users fetched successfully (Admin only)!');
    } catch (error) {
      handleError(error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.getAllOrders();
      setOrders(res.data.data.data);
      setMessage('Orders fetched successfully (User can see own, Admin can see all)!');
    } catch (error) {
      handleError(error);
    }
  };

  const createExampleOrder = async () => {
    if (!products.length) {
      setMessage('Please fetch products first to create an order.');
      return;
    }
    try {
      const res = await api.createOrder({
        items: [
          { productId: products[0].id, quantity: 1 },
          { productId: products[1].id, quantity: 2 },
        ],
        shippingAddress: '123 Frontend Street, React City',
      });
      setMessage(`Order created! ID: ${res.data.data.id}`);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      handleError(error);
    }
  }


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Mobile App Backend Demo (Frontend)</h1>
      <p style={{ color: 'red' }}>{message}</p>

      <h2>Authentication</h2>
      <div>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="text" placeholder="Name (for register)" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleRegister}>Register</button>
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleLogout}>Logout</button>
        <button onClick={handleRefreshTokens}>Refresh Tokens</button>
      </div>
      <p>Access Token: {accessToken ? 'Active' : 'Not Set'}</p>
      <p>Refresh Token: {refreshToken ? 'Active' : 'Not Set'}</p>

      <h2 style={{ marginTop: '30px' }}>Data Operations</h2>
      <div>
        <h3>Products</h3>
        <button onClick={fetchProducts}>Fetch All Products</button>
        <button onClick={() => setProducts([])}>Clear Products</button>
        <ul style={{ maxHeight: '200px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
          {products.map(p => <li key={p.id}>{p.name} - ${p.price} ({p.stock} in stock)</li>)}
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Users (Admin Protected)</h3>
        <button onClick={fetchUsers}>Fetch All Users</button>
        <button onClick={() => setUsers([])}>Clear Users</button>
        <ul style={{ maxHeight: '200px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
          {users.map(u => <li key={u.id}>{u.name} ({u.email}) - {u.role}</li>)}
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Orders</h3>
        <button onClick={fetchOrders}>Fetch My/All Orders</button>
        <button onClick={createExampleOrder} disabled={!products.length || !accessToken}>Create Example Order</button>
        <button onClick={() => setOrders([])}>Clear Orders</button>
        <ul style={{ maxHeight: '200px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
          {orders.map(o => <li key={o.id}>Order {o.id.substring(0,8)} - User: {o.user?.name || o.userId} - Total: ${o.totalAmount} - Status: {o.status}</li>)}
        </ul>
      </div>

      <h2 style={{ marginTop: '30px' }}>Setup Instructions for Frontend</h2>
      <ol>
        <li>Navigate to the `frontend` directory: <code>cd frontend</code></li>
        <li>Install dependencies: <code>npm install</code></li>
        <li>Create a `.env` file (if not present) with: <code>REACT_APP_API_BASE_URL=http://localhost:3000/api/v1</code></li>
        <li>Start the React app: <code>npm start</code> (runs on `http://localhost:3001`)</li>
        <li>Ensure the backend is running on `http://localhost:3000`.</li>
      </ol>
      <p>Use default credentials: <code>admin@example.com</code> / <code>admin123</code> OR <code>user@example.com</code> / <code>user123</code> (after running backend seed).</p>
    </div>
  );
}

export default App;
```