```javascript
const productService = require('../services/productService');
const logger = require('../utils/logger');
const { clearCache } = require('../middleware/cacheMiddleware');

const getProducts = async (req, res, next) => {
  try {
    const { page, limit, search, minPrice, maxPrice, sortBy, sortOrder } = req.query;
    const products = await productService.getProducts({}, { page, limit, search, minPrice, maxPrice, sortBy, sortOrder });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user.id);
    await clearCache('products'); // Clear cache after creating a product
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user.id);
    await clearCache('products'); // Clear cache after updating a product
    await clearCache(`products:${req.params.id}`); // Clear individual product cache
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.id);
    await clearCache('products'); // Clear cache after deleting a product
    await clearCache(`products:${req.params.id}`); // Clear individual product cache
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
```