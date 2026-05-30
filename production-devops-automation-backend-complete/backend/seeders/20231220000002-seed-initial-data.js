```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        id: uuidv4(),
        username: 'adminuser',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        username: 'testuser',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', users, {});

    const adminUser = users[0];
    const testUser = users[1];

    const projects = [
      {
        id: uuidv4(),
        name: 'Alpha Project',
        description: 'First project for the team.',
        status: 'active',
        owner_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Beta Initiative',
        description: 'Second strategic initiative.',
        status: 'on-hold',
        owner_id: testUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('projects', projects, {});

    const alphaProject = projects[0];
    const betaProject = projects[1];

    const tasks = [
      {
        id: uuidv4(),
        title: 'Setup initial project structure',
        description: 'Create repositories, configure CI/CD.',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 86400000 * 2), // 2 days ago
        project_id: alphaProject.id,
        assignee_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Develop User Authentication',
        description: 'Implement JWT-based authentication for users.',
        status: 'in-progress',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000 * 5), // 5 days from now
        project_id: alphaProject.id,
        assignee_id: testUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Market Research for new features',
        description: 'Conduct surveys and competitor analysis.',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 86400000 * 10), // 10 days from now
        project_id: betaProject.id,
        assignee_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('tasks', tasks, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
```