const productService = require('../services/product.service');
const logger = require('../utils/logger');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    logger.error('Error in createProduct controller:', error);
    next(error); // Pass error to global error handler
  }
};

const getProducts = async (req, res, next) => {
  try {
    const filter = pick(req.query, ['name', 'categoryId', 'minPrice', 'maxPrice']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'order']);
    const result = await productService.queryProducts(filter, options);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Error in getProducts controller:', error);
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found' });
    }
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    logger.error('Error in getProduct controller:', error);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProductById(req.params.productId, req.body);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found' });
    }
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    logger.error('Error in updateProduct controller:', error);
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await productService.deleteProductById(req.params.productId);
    if (!deleted) {
      return res.status(404).json({ status: 'fail', message: 'Product not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    logger.error('Error in deleteProduct controller:', error);
    next(error);
  }
};

// Helper function to pick allowed keys from an object
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};