import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { productApiService } from '../services/product.service';
import '../App.css'; // For form styles

function ProductFormPage() {
  const { id } = useParams(); // Get product ID from URL for editing
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && token) {
      setLoading(true);
      productApiService.getProductById(id, token)
        .then(product => {
          setName(product.name);
          setDescription(product.description || '');
          setPrice(product.price);
          setStock(product.stock);
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to fetch product for editing.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10)
    };

    try {
      if (isEditMode) {
        await productApiService.updateProduct(id, productData, token);
      } else {
        await productApiService.createProduct(productData, token);
      }
      navigate('/products'); // Redirect to product list after save
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} product.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="loading-message">Loading product data...</div>;
  }

  return (
    <div className="form-container">
      <h2>{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Product Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="stock">Stock:</label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="0"
            required
            disabled={loading}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
        </button>
      </form>
    </div>
  );
}

export default ProductFormPage;
```

```