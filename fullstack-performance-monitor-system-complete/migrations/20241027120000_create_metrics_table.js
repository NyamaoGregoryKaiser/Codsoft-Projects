```javascript
exports.up = function(knex) {
  return knex.schema.createTable('metrics', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.float('value').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('metrics');
};
```