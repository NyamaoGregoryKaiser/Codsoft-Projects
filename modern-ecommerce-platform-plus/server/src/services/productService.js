```javascript
// server/src/services/productService.js
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status-codes');

const createProduct = async (productData) => {
  return prisma.product.create({ data: productData });
};

const getProducts = async (filters, options) => {
  const { search, category, brand, minPrice, maxPrice } = filters;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { equals: category, mode: 'insensitive' };
  if (brand) where.brand = { equals: brand, mode: 'insensitive' };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: parseInt(limit, 10),
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.product.count({ where });

  return { products, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

const getProductById = async (productId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return product;
};

const updateProduct = async (productId, updateData) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return prisma.product.update({ where: { id: productId }, data: updateData });
};

const deleteProduct = async (productId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  await prisma.product.delete({ where: { id: productId } });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};

```