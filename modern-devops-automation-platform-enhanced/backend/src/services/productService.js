```javascript
const { Product, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize'); // For query optimization

const getProducts = async (filters, options) => {
  try {
    const { page = 1, limit = 10, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (minPrice) {
      whereClause.price = { [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(maxPrice) };
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }] // Include owner info
    });
    return products;
  } catch (error) {
    logger.error(`Error fetching products: ${error.message}`);
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    const product = await Product.findByPk(id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }]
    });
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    logger.error(`Error fetching product with id ${id}: ${error.message}`);
    throw error;
  }
};

const createProduct = async (productData, userId) => {
  try {
    const newProduct = await Product.create({ ...productData, userId });
    return newProduct;
  } catch (error) {
    logger.error(`Error creating product: ${error.message}`);
    throw error;
  }
};

const updateProduct = async (id, productData, userId) => {
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }
    // Only allow owner or admin to update
    const requestingUser = await User.findByPk(userId);
    if (product.userId !== userId && !(requestingUser && requestingUser.role === 'admin')) {
      throw new Error('Unauthorized to update this product');
    }

    const updatedProduct = await product.update(productData);
    return updatedProduct;
  } catch (error) {
    logger.error(`Error updating product with id ${id}: ${error.message}`);
    throw error;
  }
};

const deleteProduct = async (id, userId) => {
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }
    // Only allow owner or admin to delete
    const requestingUser = await User.findByPk(userId);
    if (product.userId !== userId && !(requestingUser && requestingUser.role === 'admin')) {
      throw new Error('Unauthorized to delete this product');
    }

    await product.destroy();
    return { message: 'Product deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting product with id ${id}: ${error.message}`);
    throw error;
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