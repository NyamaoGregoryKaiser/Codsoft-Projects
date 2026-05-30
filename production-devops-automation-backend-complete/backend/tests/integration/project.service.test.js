```javascript
const projectService = require('../../src/services/project.service');
const { Project, User, sequelize } = require('../../src/models');
const AppError = require('../../src/utils/appError');
const { v4: uuidv4 } = require('uuid');

// Mock logger to prevent console spam during tests
jest.mock('../../src/config/logger.config', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('projectService Integration Tests', () => {
  let testUser;
  let adminUser;

  beforeAll(async () => {
    // These users are seeded in the global setup.js
    testUser = await User.findByPk('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d');
    adminUser = await User.findByPk('f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c');

    if (!testUser || !adminUser) {
      throw new Error('Test users not found from setup. Ensure setup.js runs correctly.');
    }
  });

  beforeEach(async () => {
    // Clean up projects before each test to ensure isolation
    await Project.destroy({ where: {}, truncate: true });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const projectName = 'New Test Project';
      const projectDescription = 'Description for new project';
      const project = await projectService.createProject(projectName, projectDescription, testUser.id);

      expect(project).toBeDefined();
      expect(project.name).toBe(projectName);
      expect(project.description).toBe(projectDescription);
      expect(project.ownerId).toBe(testUser.id);

      const foundProject = await Project.findByPk(project.id);
      expect(foundProject).not.toBeNull();
      expect(foundProject.name).toBe(projectName);
    });

    it('should throw AppError if project name already exists for the same user', async () => {
      const projectName = 'Existing Project';
      await projectService.createProject(projectName, 'Desc', testUser.id);

      await expect(projectService.createProject(projectName, 'Another Desc', testUser.id))
        .rejects.toThrow(new AppError('Project with this name already exists.', 400));
    });

    it('should throw if DB operation fails', async () => {
      // Temporarily break a model to simulate DB error
      const originalCreate = Project.create;
      Project.create = jest.fn().mockRejectedValue(new Error('DB connection lost'));

      await expect(projectService.createProject('Fail Project', 'Desc', testUser.id))
        .rejects.toThrow('DB connection lost');

      Project.create = originalCreate; // Restore
    });
  });

  describe('getAllProjects', () => {
    let project1, project2, project3;
    beforeEach(async () => {
      project1 = await projectService.createProject('User Project 1', 'Desc 1', testUser.id);
      project2 = await projectService.createProject('User Project 2', 'Desc 2', testUser.id);
      project3 = await projectService.createProject('Admin Project 1', 'Desc 3', adminUser.id);
    });

    it('should return all projects for an admin user', async () => {
      const projects = await projectService.getAllProjects(adminUser.id, 'admin');
      expect(projects).toHaveLength(3);
      expect(projects.map(p => p.name)).toEqual(expect.arrayContaining([project1.name, project2.name, project3.name]));
    });

    it('should return only projects owned by the user for a non-admin user', async () => {
      const projects = await projectService.getAllProjects(testUser.id, 'user');
      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.name)).toEqual(expect.arrayContaining([project1.name, project2.name]));
      expect(projects.map(p => p.name)).not.toContain(project3.name);
    });
  });

  describe('getProjectById', () => {
    let project;
    beforeEach(async () => {
      project = await projectService.createProject('Single Project', 'Description', testUser.id);
    });

    it('should return a project by ID for the owner', async () => {
      const foundProject = await projectService.getProjectById(project.id, testUser.id, 'user');
      expect(foundProject).toBeDefined();
      expect(foundProject.id).toBe(project.id);
      expect(foundProject.owner.username).toBe(testUser.username); // Eager loaded owner
    });

    it('should return a project by ID for an admin', async () => {
      const foundProject = await projectService.getProjectById(project.id, adminUser.id, 'admin');
      expect(foundProject).toBeDefined();
      expect(foundProject.id).toBe(project.id);
    });

    it('should throw AppError if project not found', async () => {
      const nonExistentId = uuidv4();
      await expect(projectService.getProjectById(nonExistentId, testUser.id, 'user'))
        .rejects.toThrow(new AppError('Project not found', 404));
    });

    it('should throw AppError if user is not authorized', async () => {
      const anotherUser = await User.create({
        id: uuidv4(),
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'hashedPassword',
        role: 'user',
      });
      await expect(projectService.getProjectById(project.id, anotherUser.id, 'user'))
        .rejects.toThrow(new AppError('Not authorized to access this project', 403));
    });
  });

  describe('updateProject', () => {
    let project;
    beforeEach(async () => {
      project = await projectService.createProject('Updatable Project', 'Initial Desc', testUser.id);
    });

    it('should update a project for the owner', async () => {
      const updates = { description: 'Updated Description', status: 'completed' };
      const updatedProject = await projectService.updateProject(project.id, updates, testUser.id, 'user');

      expect(updatedProject.description).toBe(updates.description);
      expect(updatedProject.status).toBe(updates.status);

      const foundProject = await Project.findByPk(project.id);
      expect(foundProject.description).toBe(updates.description);
      expect(foundProject.status).toBe(updates.status);
    });

    it('should update a project for an admin', async () => {
      const updates = { name: 'Admin Updated Name' };
      const updatedProject = await projectService.updateProject(project.id, updates, adminUser.id, 'admin');
      expect(updatedProject.name).toBe(updates.name);
    });

    it('should throw AppError if project not found', async () => {
      const nonExistentId = uuidv4();
      await expect(projectService.updateProject(nonExistentId, { name: 'New Name' }, testUser.id, 'user'))
        .rejects.toThrow(new AppError('Project not found', 404));
    });

    it('should throw AppError if user is not authorized', async () => {
      const anotherUser = await User.create({
        id: uuidv4(),
        username: 'anotheruser2',
        email: 'another2@example.com',
        password: 'hashedPassword',
        role: 'user',
      });
      await expect(projectService.updateProject(project.id, { name: 'New Name' }, anotherUser.id, 'user'))
        .rejects.toThrow(new AppError('Not authorized to update this project', 403));
    });
  });

  describe('deleteProject', () => {
    let project;
    beforeEach(async () => {
      project = await projectService.createProject('Deletable Project', 'Description', testUser.id);
    });

    it('should delete a project for the owner', async () => {
      const result = await projectService.deleteProject(project.id, testUser.id, 'user');
      expect(result.message).toBe('Project deleted successfully');

      const foundProject = await Project.findByPk(project.id);
      expect(foundProject).toBeNull();
    });

    it('should delete a project for an admin', async () => {
      const result = await projectService.deleteProject(project.id, adminUser.id, 'admin');
      expect(result.message).toBe('Project deleted successfully');
    });

    it('should throw AppError if project not found', async () => {
      const nonExistentId = uuidv4();
      await expect(projectService.deleteProject(nonExistentId, testUser.id, 'user'))
        .rejects.toThrow(new AppError('Project not found', 404));
    });

    it('should throw AppError if user is not authorized', async () => {
      const anotherUser = await User.create({
        id: uuidv4(),
        username: 'anotheruser3',
        email: 'another3@example.com',
        password: 'hashedPassword',
        role: 'user',
      });
      await expect(projectService.deleteProject(project.id, anotherUser.id, 'user'))
        .rejects.toThrow(new AppError('Not authorized to delete this project', 403));
    });
  });
});
```