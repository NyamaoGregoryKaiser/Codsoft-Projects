// controllers/products.js
const Product = require('../models/product');

async function getProducts(req, res) {
  try {
    const products = await Product.find().lean(); // lean() for performance
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

module.exports = { getProducts };

// models/product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  // ... other fields
}, { timestamps: true });

productSchema.index({ name: 1 }); // Example index

module.exports = mongoose.model('Product', productSchema);

