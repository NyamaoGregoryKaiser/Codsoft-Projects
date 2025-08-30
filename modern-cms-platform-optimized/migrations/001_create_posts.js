```javascript
// migrations/001_create_posts.js
exports.up = function(knex) {
  return knex.schema.createTable('posts', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('posts');
};
```