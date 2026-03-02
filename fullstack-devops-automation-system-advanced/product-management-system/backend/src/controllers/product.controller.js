const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { productService } = require('../services');
const { invalidateCache } = require('../utils/cache');

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct({ ...req.body, userId: req.user.id });
  // Invalidate cache for the user's products list
  invalidateCache(`products:${req.user.id}`);
  res.status(httpStatus.CREATED).send({ message: 'Product created successfully', product });
});

const getProducts = catchAsync(async (req, res) => {
  // Pass query parameters for filtering/pagination if implemented
  const products = await productService.getProductsByUserId(req.user.id);
  res.send(products);
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductByIdAndUserId(req.params.id, req.user.id);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by user');
  }
  res.send(product);
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProductByIdAndUserId(req.params.id, req.user.id, req.body);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by user');
  }
  // Invalidate cache for the user's products list and specific product
  invalidateCache(`products:${req.user.id}`);
  invalidateCache(`product:${req.params.id}`);
  res.send({ message: 'Product updated successfully', product });
});

const deleteProduct = catchAsync(async (req, res) => {
  const deletedCount = await productService.deleteProductByIdAndUserId(req.params.id, req.user.id);
  if (deletedCount === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by user');
  }
  // Invalidate cache for the user's products list and specific product
  invalidateCache(`products:${req.user.id}`);
  invalidateCache(`product:${req.params.id}`);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};
```

```