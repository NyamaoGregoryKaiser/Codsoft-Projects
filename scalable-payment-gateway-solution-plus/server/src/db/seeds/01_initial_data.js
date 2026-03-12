```javascript
const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('transactions').del();
  await knex('payment_intents').del();
  await knex('products').del();
  await knex('merchants').del();
  await knex('users').del();

  const hashedPasswordAdmin = await bcrypt.hash('password123', 10);
  const hashedPasswordMerchant = await bcrypt.hash('password123', 10);
  const hashedPasswordCustomer = await bcrypt.hash('password123', 10);

  // Insert Users
  const [adminUser] = await knex('users').insert({
    email: 'admin@paypro.com',
    password: hashedPasswordAdmin,
    first_name: 'Super',
    last_name: 'Admin',
    role: 'admin'
  }).returning('*');

  const [merchantUser] = await knex('users').insert({
    email: 'merchant@example.com',
    password: hashedPasswordMerchant,
    first_name: 'Alice',
    last_name: 'Merchant',
    role: 'merchant'
  }).returning('*');

  const [customerUser] = await knex('users').insert({
    email: 'customer@example.com',
    password: hashedPasswordCustomer,
    first_name: 'Bob',
    last_name: 'Customer',
    role: 'customer'
  }).returning('*');

  // Insert Merchant
  const [merchant] = await knex('merchants').insert({
    user_id: merchantUser.id,
    name: 'Awesome Shop',
    legal_name: 'Awesome Shop LLC',
    website_url: 'https://awesomeshop.com',
    business_address: '123 Main St, Anytown, USA',
    phone_number: '555-123-4567',
    status: 'approved'
  }).returning('*');

  // Insert Products
  const [product1] = await knex('products').insert({
    merchant_id: merchant.id,
    name: 'Fancy Gadget',
    description: 'A very fancy gadget to make your life easier.',
    price: 99.99,
    currency: 'USD',
    stock_quantity: 100,
    image_url: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Gadget'
  }).returning('*');

  const [product2] = await knex('products').insert({
    merchant_id: merchant.id,
    name: 'Magic Widget',
    description: 'Unlocks endless possibilities with its magical powers.',
    price: 19.99,
    currency: 'USD',
    stock_quantity: 50,
    image_url: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Widget'
  }).returning('*');

  console.log('Seed data inserted successfully.');
};
```

---

### 3. Configuration & Setup

#### Docker Setup