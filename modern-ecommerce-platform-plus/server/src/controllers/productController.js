```javascript
// server/src/controllers/productController.js
const httpStatus = require('http-status-codes');
const productService = require('../services/productService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(httpStatus.CREATED).json(product);
});

const getProducts = catchAsync(async (req, res) => {
  const filters = req.query;
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };
  const result = await productService.getProducts(filters, options);
  res.status(httpStatus.OK).json(result);
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.productId);
  res.status(httpStatus.OK).json(product);
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.productId, req.body);
  res.status(httpStatus.OK).json(product);
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.productId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};

```