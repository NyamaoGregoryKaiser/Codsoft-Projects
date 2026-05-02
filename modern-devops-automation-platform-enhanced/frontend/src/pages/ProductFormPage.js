```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

function ProductFormPage() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/products/${id}`);
          const product = response.data;
          setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch product.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="container">Loading product data...</div>;
  }

  return (
    <div className="container">
      <h1>{isEditMode ? 'Edit Product' : 'Create New Product'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Product Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="stock">Stock:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {isEditMode ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}

export default ProductFormPage;
```