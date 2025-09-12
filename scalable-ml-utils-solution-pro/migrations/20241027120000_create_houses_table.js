```javascript
exports.up = function(knex) {
  return knex.schema.createTable('houses', table => {
    table.increments('id').primary();
    table.float('size');
    table.integer('bedrooms');
    table.integer('bathrooms');
    table.float('price');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('houses');
};
```