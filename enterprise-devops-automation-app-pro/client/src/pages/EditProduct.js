import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../api/productService';
import { useAuth } from '../auth/AuthContext';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth(); // Needed for authorization check
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [productOwnerId, setProductOwnerId] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getProductById(id);
        const productData = response.data.data.product;
        setFormData({
          name: productData.name,
          description: productData.description || '',
          price: productData.price,
          stock: productData.stock,
          imageUrl: productData.imageUrl || '',
        });
        setProductOwnerId(productData.owner.id);
        setLoading(false);
      } catch (err) {
        setError('Failed to load product for editing.');
        console.error('Error fetching product:', err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic client-side validation for form fields
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Product name, price, and stock are required.');
      setLoading(false);
      return;
    }
    if (parseFloat(formData.price) < 0 || parseInt(formData.stock) < 0) {
      setError('Price and stock cannot be negative.');
      setLoading(false);
      return;
    }

    try {
      await productService.updateProduct(id, formData);
      navigate('/dashboard'); // Redirect to dashboard after successful update
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product.');
      console.error('Error updating product:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-xl mt-10">Loading product for editing...</div>;
  }

  // Authorization check
  if (!user || (!isAdmin && user.id !== productOwnerId)) {
    return <div className="text-center text-red-500 mt-10 text-xl">You are not authorized to edit this product.</div>;
  }

  if (error && error !== 'Failed to load product for editing.') { // Display other errors
    return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Edit Product</h2>
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
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary w-full mt-4">
          Cancel
        </button>
      </form>
    </div>
  );
}

export default EditProduct;