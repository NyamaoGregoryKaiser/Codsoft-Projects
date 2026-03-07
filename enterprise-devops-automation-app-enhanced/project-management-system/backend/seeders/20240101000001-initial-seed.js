```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 8);

    const adminUserId = uuidv4();
    const user1Id = uuidv4();
    const user2Id = uuidv4();

    // Create Users
    await queryInterface.bulkInsert('users', [
      {
        id: adminUserId,
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user1Id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user2Id,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Create Projects
    const project1Id = uuidv4();
    const project2Id = uuidv4();

    await queryInterface.bulkInsert('projects', [
      {
        id: project1Id,
        name: 'Backend API Development',
        description: 'Develop a robust and scalable backend API for the project management system.',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        ownerId: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: project2Id,
        name: 'Frontend UI Redesign',
        description: 'Redesign the user interface for better user experience and modern aesthetics.',
        status: 'pending',
        startDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        ownerId: user1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Add Project Members
    await queryInterface.bulkInsert('UserProjects', [
      { userId: user1Id, projectId: project1Id, createdAt: new Date(), updatedAt: new Date() }, // John Doe is member of Project 1 (owned by Admin)
      { userId: user2Id, projectId: project1Id, createdAt: new Date(), updatedAt: new Date() }, // Jane Smith is member of Project 1
      { userId: adminUserId, projectId: project2Id, createdAt: new Date(), updatedAt: new Date() }, // Admin is member of Project 2 (owned by John Doe)
    ], {});

    // Create Tasks
    const task1Id = uuidv4();
    const task2Id = uuidv4();
    const task3Id = uuidv4();

    await queryInterface.bulkInsert('tasks', [
      {
        id: task1Id,
        projectId: project1Id,
        title: 'Implement User Authentication',
        description: 'Set up JWT-based authentication for user login and registration.',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        assignedTo: user1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: task2Id,
        projectId: project1Id,
        title: 'Database Schema Design',
        description: 'Design the PostgreSQL schema for users, projects, tasks, and comments.',
        status: 'done',
        priority: 'high',
        dueDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        assignedTo: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: task3Id,
        projectId: project2Id,
        title: 'Design Project Listing Page',
        description: 'Create mockups and implement the React component for project listing.',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        assignedTo: user2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Create Comments
    await queryInterface.bulkInsert('comments', [
      {
        id: uuidv4(),
        taskId: task1Id,
        userId: adminUserId,
        content: 'Started working on this task. Need to finalize JWT secret management.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        taskId: task1Id,
        userId: user1Id,
        content: 'Agreed. Let\'s review config files by end of week.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        taskId: task3Id,
        userId: user1Id,
        content: 'The Figma designs for the project list page are ready for review.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('UserProjects', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
```