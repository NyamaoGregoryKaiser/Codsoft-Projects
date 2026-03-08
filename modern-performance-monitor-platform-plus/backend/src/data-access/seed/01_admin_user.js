```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Check if admin user already exists
  const existingUser = await knex('users').where('email', config.admin.email).first();

  if (existingUser) {
    console.log(`Admin user with email ${config.admin.email} already exists.`);
    return;
  }

  // Has the admin password
  const hashedPassword = await bcrypt.hash(config.admin.password, 10);

  // Insert admin user
  await knex('users').insert([
    {
      id: uuidv4(),
      email: config.admin.email,
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);

  console.log('Admin user seeded successfully.');
};
```