```javascript
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import ItemCard from '../components/ItemCard';
import useAuth from '../hooks/useAuth'; // Use useAuth to get user info

const Dashboard = () => {
  const { user } = useAuth(); // Get current user from auth hook
  const [items, setItems] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/items/');
      setItems(response.data);
    } catch (err) {
      console.error("Failed to fetch items:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to fetch items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) { // Only fetch if user is authenticated
      fetchItems();
    }
  }, [user, fetchItems]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setError('');
    if (!newItemTitle.trim()) {
      setError('Item title cannot be empty.');
      return;
    }
    try {
      await axiosInstance.post('/items/', {
        title: newItemTitle,
        description: newItemDescription,
      });
      setNewItemTitle('');
      setNewItemDescription('');
      fetchItems(); // Refresh items list
    } catch (err) {
      console.error("Failed to create item:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to create item.');
    }
  };

  const handleUpdateItem = async (itemId, updateData) => {
    setError('');
    try {
      await axiosInstance.put(`/items/${itemId}`, updateData);
      fetchItems(); // Refresh items list
    } catch (err) {
      console.error("Failed to update item:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to update item.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    try {
      await axiosInstance.delete(`/items/${itemId}`);
      fetchItems(); // Refresh items list
    } catch (err) {
      console.error("Failed to delete item:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to delete item.');
    }
  };

  if (loading) return <div className="container">Loading items...</div>;

  return (
    <div className="container">
      <h2>My Dashboard</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>Create New Item</h3>
        <form onSubmit={handleCreateItem}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description (Optional):</label>
            <input
              type="text"
              id="description"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Add Item</button>
        </form>
      </div>

      <h3>My Items</h3>
      {items.length === 0 ? (
        <p>No items found. Create one above!</p>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```