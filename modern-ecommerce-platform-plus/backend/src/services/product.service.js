const knex = require('../database/knexfile');
const logger = require('../utils/logger');

const createProduct = async (productData) => {
  try {
    const [product] = await knex('products')
      .insert(productData)
      .returning('*');
    return product;
  } catch (error) {
    logger.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
};

const queryProducts = async (filter, options) => {
  const { name, categoryId, minPrice, maxPrice } = filter;
  const { sortBy = 'createdAt', order = 'desc', limit = 10, page = 1 } = options;
  const offset = (page - 1) * limit;

  const productsQuery = knex('products')
    .select(
      'products.*',
      knex.raw('COALESCE(categories.name, ?) as category_name', ['Uncategorized'])
    )
    .leftJoin('categories', 'products.categoryId', 'categories.id');

  if (name) {
    productsQuery.where('products.name', 'ilike', `%${name}%`);
  }
  if (categoryId) {
    productsQuery.where('products.categoryId', categoryId);
  }
  if (minPrice !== undefined) {
    productsQuery.where('products.price', '>=', minPrice);
  }
  if (maxPrice !== undefined) {
    productsQuery.where('products.price', '<=', maxPrice);
  }

  const countQuery = productsQuery.clone().count('products.id as total').first();
  const dataQuery = productsQuery.clone()
    .orderBy(sortBy, order)
    .limit(limit)
    .offset(offset);

  const [countResult, products] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  const totalResults = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    products,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

const getProductById = async (productId) => {
  return knex('products')
    .select(
      'products.*',
      knex.raw('COALESCE(categories.name, ?) as category_name', ['Uncategorized'])
    )
    .leftJoin('categories', 'products.categoryId', 'categories.id')
    .where('products.id', productId)
    .first();
};

const updateProductById = async (productId, updateBody) => {
  const product = await knex('products').where({ id: productId }).first();
  if (!product) {
    return null; // Product not found
  }

  const [updatedProduct] = await knex('products')
    .where({ id: productId })
    .update({
      ...updateBody,
      updatedAt: knex.fn.now(),
    })
    .returning('*');
  return updatedProduct;
};

const deleteProductById = async (productId) => {
  const deletedCount = await knex('products').where({ id: productId }).del();
  return deletedCount > 0;
};

module.exports = {
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};