exports.seed = async function(knex) {
  await knex('categories').del();

  await knex('categories').insert([
    { id: 1, name: 'Electronics', description: 'Gadgets and electronic devices.', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
    { id: 2, name: 'Books', description: 'Various genres of books.', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
    { id: 3, name: 'Clothing', description: 'Apparel for men, women, and children.', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
    { id: 4, name: 'Home & Kitchen', description: 'Items for your home and kitchen.', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
    { id: 5, name: 'Sports & Outdoors', description: 'Gear for sports and outdoor activities.', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
  ]);
};