const { Product, User } = require('../models');
const logger = require('../utils/logger');
const redisClient = require('../utils/redisClient');

const PRODUCT_CACHE_KEY = 'all_products';

exports.getAllProducts = async (req, res, next) => {
  try {
    // Try to get from cache
    const cachedProducts = await redisClient.get(PRODUCT_CACHE_KEY);
    if (cachedProducts) {
      logger.info('Serving products from cache');
      return res.status(200).json({
        status: 'success',
        results: JSON.parse(cachedProducts).length,
        data: { products: JSON.parse(cachedProducts) },
      });
    }

    const products = await Product.findAll({
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'email'] // Eager loading user data
      }
    });

    // Store in cache for 1 hour
    await redisClient.set(PRODUCT_CACHE_KEY, JSON.stringify(products), { EX: 3600 });
    logger.info('Serving products from DB and caching');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: { products },
    });
  } catch (err) {
    next(new Error(`Failed to retrieve products: ${err.message}`, { cause: 500 }));
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cachedProduct = await redisClient.get(`product:${id}`);
    if (cachedProduct) {
      logger.info(`Serving product ${id} from cache`);
      return res.status(200).json({
        status: 'success',
        data: { product: JSON.parse(cachedProduct) },
      });
    }

    const product = await Product.findByPk(id, {
      include: {
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'email']
      }
    });

    if (!product) {
      return next(new Error('Product not found with that ID.', { cause: 404 }));
    }

    // Store in cache for 1 hour
    await redisClient.set(`product:${id}`, JSON.stringify(product), { EX: 3600 });
    logger.info(`Serving product ${id} from DB and caching`);

    res.status(200).json({
      status: 'success',
      data: { product },
    });
  } catch (err) {
    next(new Error(`Failed to retrieve product: ${err.message}`, { cause: 500 }));
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;
    // req.user is populated by `protect` middleware
    if (!req.user) {
        return next(new Error('User not authenticated.', { cause: 401 }));
    }
    const userId = req.user.id; // Assign product to the authenticated user

    if (!name || !price || !stock) {
      return next(new Error('Product name, price, and stock are required.', { cause: 400 }));
    }

    const newProduct = await Product.create({
      name,
      description,
      price,
      stock,
      imageUrl,
      userId
    });

    // Invalidate cache for all products
    await redisClient.del(PRODUCT_CACHE_KEY);

    logger.info(`Product created: ${newProduct.name} by user ${userId}`);
    res.status(201).json({
      status: 'success',
      data: { product: newProduct },
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return next(new Error(err.errors.map(e => e.message).join(', '), { cause: 400 }));
    }
    next(new Error(`Failed to create product: ${err.message}`, { cause: 500 }));
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, imageUrl } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return next(new Error('Product not found with that ID.', { cause: 404 }));
    }

    // Authorization check: Only owner or admin can update product
    if (product.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new Error('You do not have permission to update this product.', { cause: 403 }));
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.imageUrl = imageUrl || product.imageUrl;

    await product.save();

    // Invalidate cache for this product and all products
    await redisClient.del(PRODUCT_CACHE_KEY);
    await redisClient.del(`product:${id}`);

    logger.info(`Product updated: ${product.name}`);
    res.status(200).json({
      status: 'success',
      data: { product },
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return next(new Error(err.errors.map(e => e.message).join(', '), { cause: 400 }));
    }
    next(new Error(`Failed to update product: ${err.message}`, { cause: 500 }));
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return next(new Error('Product not found with that ID.', { cause: 404 }));
    }

    // Authorization check: Only owner or admin can delete product
    if (product.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new Error('You do not have permission to delete this product.', { cause: 403 }));
    }

    await product.destroy();

    // Invalidate cache for this product and all products
    await redisClient.del(PRODUCT_CACHE_KEY);
    await redisClient.del(`product:${id}`);

    logger.info(`Product deleted: ${product.name}`);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(new Error(`Failed to delete product: ${err.message}`, { cause: 500 }));
  }
  };