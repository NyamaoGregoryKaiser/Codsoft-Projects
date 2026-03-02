import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const productApiService = {
  /**
   * Get all products for the authenticated user.
   * @param {string} token - JWT token.
   * @returns {Promise<Array>} List of products.
   */
  getProducts: async (token) => {
    const response = await axios.get(`${API_URL}/products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Get a single product by ID for the authenticated user.
   * @param {string} id - Product ID.
   * @param {string} token - JWT token.
   * @returns {Promise<Object>} Product data.
   */
  getProductById: async (id, token) => {
    const response = await axios.get(`${API_URL}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Create a new product.
   * @param {Object} productData - Product data (name, description, price, stock).
   * @param {string} token - JWT token.
   * @returns {Promise<Object>} Created product data.
   */
  createProduct: async (productData, token) => {
    const response = await axios.post(`${API_URL}/products`, productData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.product;
  },

  /**
   * Update an existing product.
   * @param {string} id - Product ID.
   * @param {Object} productData - Updated product data.
   * @param {string} token - JWT token.
   * @returns {Promise<Object>} Updated product data.
   */
  updateProduct: async (id, productData, token) => {
    const response = await axios.put(`${API_URL}/products/${id}`, productData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.product;
  },

  /**
   * Delete a product.
   * @param {string} id - Product ID.
   * @param {string} token - JWT token.
   * @returns {Promise<void>}
   */
  deleteProduct: async (id, token) => {
    await axios.delete(`${API_URL}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export { productApiService };
```

```