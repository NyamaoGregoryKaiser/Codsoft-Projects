```javascript
// seeds/001_tasks.js
exports.seed = function(knex) {
  return knex('tasks').insert([
    {title: 'Task 1', description: 'Description 1', completed: false, user_id: 1},
    {title: 'Task 2', description: 'Description 2', completed: true, user_id: 1}
  ]);
};
```