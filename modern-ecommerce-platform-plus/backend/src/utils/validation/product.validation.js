const Joi = require('joi');

const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required().min(3).max(255),
    description: Joi.string().max(1000),
    price: Joi.number().min(0).precision(2).required(),
    stock: Joi.number().integer().min(0).required(),
    categoryId: Joi.number().integer().min(1).required(),
    imageUrl: Joi.string().uri().allow(null, ''),
  }),
};

const getProducts = {
  query: Joi.object().keys({
    name: Joi.string(),
    categoryId: Joi.number().integer().min(1),
    minPrice: Joi.number().min(0).precision(2),
    maxPrice: Joi.number().min(0).precision(2),
    sortBy: Joi.string().valid('name', 'price', 'createdAt'),
    order: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.number().integer().min(1).required(),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.number().integer().min(1).required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().min(3).max(255),
    description: Joi.string().max(1000),
    price: Joi.number().min(0).precision(2),
    stock: Joi.number().integer().min(0),
    categoryId: Joi.number().integer().min(1),
    imageUrl: Joi.string().uri().allow(null, ''),
  }).min(1), // At least one field is required
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.number().integer().min(1).required(),
  }),
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};