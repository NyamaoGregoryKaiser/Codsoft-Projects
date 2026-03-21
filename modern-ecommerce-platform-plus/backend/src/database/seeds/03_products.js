exports.seed = async function(knex) {
  await knex('products').del();

  await knex('products').insert([
    {
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality sound with comfortable over-ear design. Noise-cancelling feature included.',
      price: 79.99,
      stock: 50,
      categoryId: 1, // Electronics
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06a244?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'The Alchemist',
      description: 'A philosophical novel by Paulo Coelho. An international bestseller.',
      price: 12.50,
      stock: 120,
      categoryId: 2, // Books
      imageUrl: 'https://images.unsplash.com/photo-1543002588-ed5a266b04a0?auto=format&fit=crop&q=80&w=1935&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Men\'s Casual T-Shirt',
      description: 'Comfortable cotton t-shirt, perfect for everyday wear. Available in multiple colors.',
      price: 19.99,
      stock: 200,
      categoryId: 3, // Clothing
      imageUrl: 'https://images.unsplash.com/photo-1621243702526-d621b068222b?auto=format&fit=crop&q=80&w=1974&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Smart Watch with Heart Rate Monitor',
      description: 'Track your fitness and receive notifications on the go. Water-resistant.',
      price: 129.99,
      stock: 30,
      categoryId: 1, // Electronics
      imageUrl: 'https://images.unsplash.com/photo-1579586326085-3b987b7a5a8f?auto=format&fit=crop&q=80&w=1964&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Coffee Maker Machine',
      description: 'Programmable coffee maker with a 12-cup capacity. Brews hot coffee fast.',
      price: 49.95,
      stock: 75,
      categoryId: 4, // Home & Kitchen
      imageUrl: 'https://images.unsplash.com/photo-1509785307050-dc8ad517a279?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Running Shoes - Lightweight',
      description: 'Ultra-lightweight running shoes designed for speed and comfort. Breathable mesh upper.',
      price: 89.00,
      stock: 90,
      categoryId: 5, // Sports & Outdoors
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Fjallraven Kanken Backpack',
      description: 'Classic backpack suitable for school, work or travel. Durable and water-resistant.',
      price: 75.00,
      stock: 40,
      categoryId: 3, // Clothing (or accessories)
      imageUrl: 'https://images.unsplash.com/photo-1546768379-58b9f074d6c6?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Hardcover Notebook',
      description: 'Premium quality notebook with 192 lined pages. Perfect for journaling or notes.',
      price: 15.00,
      stock: 150,
      categoryId: 2, // Books (or stationery)
      imageUrl: 'https://images.unsplash.com/photo-1594915002444-245ad006497f?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Wireless Gaming Mouse',
      description: 'Ergonomic design with high precision sensor. Customizable RGB lighting.',
      price: 59.99,
      stock: 60,
      categoryId: 1, // Electronics
      imageUrl: 'https://images.unsplash.com/photo-1579586326085-3b987b7a5a8f?auto=format&fit=crop&q=80&w=1964&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Reusing for variety
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Yoga Mat - Eco-Friendly',
      description: 'Non-slip and durable yoga mat made from natural rubber. Includes carrying strap.',
      price: 35.00,
      stock: 80,
      categoryId: 5, // Sports & Outdoors
      imageUrl: 'https://images.unsplash.com/photo-1591219662768-45ad8b9e6f3d?auto=format&fit=crop&q=80&w=1964&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};