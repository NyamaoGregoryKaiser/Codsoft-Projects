import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../api/productService';

function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await productService.createProduct(formData);
      navigate('/dashboard'); // Redirect to dashboard after successful creation
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
      console.error('Error adding product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Add New Product</h2>
      {error && <p className="form-error text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">Product Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description" className="form-label">Description:</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            className="form-input"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="price" className="form-label">Price:</label>
          <input
            type="number"
            id="price"
            name="price"
            className="form-input"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="stock" className="form-label">Stock:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            className="form-input"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrl" className="form-label">Image URL:</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            className="form-input"
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Adding...' : 'Add Product'}
        </button>
        <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary w-full mt-4">
          Cancel
        </button>
      </form>
    </div>
  );
}

export default AddProduct;