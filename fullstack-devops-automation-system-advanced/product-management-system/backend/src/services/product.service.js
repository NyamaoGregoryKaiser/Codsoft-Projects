const httpStatus = require('http-status');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const { getOrSetCache } = require('../utils/cache');

/**
 * Create a product
 * @param {Object} productBody
 * @returns {Promise<Product>}
 */
const createProduct = async (productBody) => {
  return Product.create(productBody);
};

/**
 * Get all products for a specific user.
 * @param {UUID} userId
 * @returns {Promise<Product[]>}
 */
const getProductsByUserId = async (userId) => {
  const cacheKey = `products:${userId}`;
  return getOrSetCache(cacheKey, async () => {
    // Basic query optimization: Select only necessary columns
    return Product.findAll({
      where: { userId },
      attributes: ['id', 'name', 'description', 'price', 'stock', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
  });
};

/**
 * Get a single product by ID and ensure it belongs to the user.
 * @param {UUID} productId
 * @param {UUID} userId
 * @returns {Promise<Product>}
 */
const getProductByIdAndUserId = async (productId, userId) => {
  const cacheKey = `product:${productId}`;
  return getOrSetCache(cacheKey, async () => {
    return Product.findOne({
      where: { id: productId, userId },
      attributes: ['id', 'name', 'description', 'price', 'stock', 'createdAt', 'updatedAt']
    });
  });
};

/**
 * Update a product by ID and user ID.
 * @param {UUID} productId
 * @param {UUID} userId
 * @param {Object} updateBody
 * @returns {Promise<Product>}
 */
const updateProductByIdAndUserId = async (productId, userId, updateBody) => {
  const product = await getProductByIdAndUserId(productId, userId); // Ensure product exists and belongs to user
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by user');
  }

  // Update product fields, ensure userId is not changed
  Object.assign(product, updateBody);
  await product.save();
  return product;
};

/**
 * Delete a product by ID and user ID.
 * @param {UUID} productId
 * @param {UUID} userId
 * @returns {Promise<number>} - The number of destroyed rows (0 or 1).
 */
const deleteProductByIdAndUserId = async (productId, userId) => {
  const deletedCount = await Product.destroy({
    where: { id: productId, userId }
  });
  return deletedCount;
};

module.exports = {
  createProduct,
  getProductsByUserId,
  getProductByIdAndUserId,
  updateProductByIdAndUserId,
  deleteProductByIdAndUserId
};
```

```