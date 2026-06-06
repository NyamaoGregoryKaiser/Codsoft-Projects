```javascript
const httpStatus = require('http-status');
const prisma = require('../../src/database/prisma');
const userService = require('../../src/modules/users/user.service');
const projectService = require('../../src/modules/projects/project.service');
const ApiError = require('../../src/utils/ApiError');

// Test users
let adminUser;
let regularUser;

// Clean up database after each test
const cleanUpDb = async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

beforeEach(async () => {
  await cleanUpDb();
  adminUser = await userService.createUser({ name: 'Admin User', email: 'admin@example.com', password: 'Password123!', role: 'ADMIN' });
  regularUser = await userService.createUser({ name: 'Regular User', email: 'user@example.com', password: 'Password123!', role: 'USER' });
});

afterAll(async () => {
  await cleanUpDb();
  await prisma.$disconnect();
});

describe('Project Service - Integration Tests', () => {
  describe('createProject', () => {
    it('should successfully create a new project', async () => {
      const projectData = {
        name: 'New Project',
        description: 'A description for the new project',
      };

      const project = await projectService.createProject(projectData, regularUser.id);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.ownerId).toBe(regularUser.id);
      expect(project.status).toBe('PENDING'); // Default status
    });
  });

  describe('queryProjects', () => {
    let project1, project2, project3;

    beforeEach(async () => {
      project1 = await projectService.createProject({ name: 'Alpha Project', status: 'IN_PROGRESS' }, regularUser.id);
      project2 = await projectService.createProject({ name: 'Beta Project', status: 'PENDING' }, regularUser.id);
      project3 = await projectService.createProject({ name: 'Gamma Project', status: 'COMPLETED' }, adminUser.id);
    });

    it('should return all projects for admin user with default pagination/sorting', async () => {
      const result = await projectService.queryProjects({}, {}, adminUser);

      expect(result.results).toHaveLength(3);
      expect(result.totalResults).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.results.map((p) => p.name)).toEqual(expect.arrayContaining(['Alpha Project', 'Beta Project', 'Gamma Project']));
    });

    it('should return only user-owned projects for a regular user', async () => {
      const result = await projectService.queryProjects({}, {}, regularUser);

      expect(result.results).toHaveLength(2);
      expect(result.totalResults).toBe(2);
      expect(result.results.map((p) => p.name)).toEqual(expect.arrayContaining(['Alpha Project', 'Beta Project']));
      expect(result.results.map((p) => p.ownerId)).not.toContain(adminUser.id);
    });

    it('should filter projects by name', async () => {
      const result = await projectService.queryProjects({ name: 'Alpha' }, {}, adminUser);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Alpha Project');
    });

    it('should filter projects by status', async () => {
      const result = await projectService.queryProjects({ status: 'PENDING' }, {}, adminUser);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Beta Project');
    });

    it('should filter projects by ownerId', async () => {
      const result = await projectService.queryProjects({ ownerId: adminUser.id }, {}, adminUser);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Gamma Project');
    });

    it('should apply pagination correctly', async () => {
      for (let i = 0; i < 15; i++) {
        await projectService.createProject({ name: `Project${i}`, description: `Desc ${i}` }, regularUser.id);
      }

      const resultPage1 = await projectService.queryProjects({}, { page: 1, limit: 10 }, adminUser);
      expect(resultPage1.results).toHaveLength(10);
      expect(resultPage1.totalResults).toBe(18); // 3 from beforeEach + 15 new
      expect(resultPage1.totalPages).toBe(2);

      const resultPage2 = await projectService.queryProjects({}, { page: 2, limit: 10 }, adminUser);
      expect(resultPage2.results).toHaveLength(8);
    });

    it('should sort projects by name in ascending order', async () => {
      const result = await projectService.queryProjects({}, { sortBy: 'name:asc' }, adminUser);
      const sortedNames = result.results.map(p => p.name);
      expect(sortedNames).toEqual(['Alpha Project', 'Beta Project', 'Gamma Project']); // Assuming default prisma order is not guaranteed, verify explicit sort
    });
  });

  describe('getProjectById', () => {
    it('should return a project by ID', async () => {
      const project = await projectService.createProject({ name: 'Test Get Project' }, regularUser.id);
      const fetchedProject = await projectService.getProjectById(project.id);

      expect(fetchedProject).toBeDefined();
      expect(fetchedProject.id).toBe(project.id);
      expect(fetchedProject.name).toBe(project.name);
    });

    it('should return null if project not found', async () => {
      const fetchedProject = await projectService.getProjectById('non-existent-id');
      expect(fetchedProject).toBeNull();
    });
  });

  describe('updateProjectById', () => {
    it('should update project name and status', async () => {
      const project = await projectService.createProject({ name: 'Old Name', status: 'PENDING' }, regularUser.id);
      const updateBody = { name: 'New Name', status: 'IN_PROGRESS' };
      const updatedProject = await projectService.updateProjectById(project.id, updateBody);

      expect(updatedProject).toBeDefined();
      expect(updatedProject.id).toBe(project.id);
      expect(updatedProject.name).toBe('New Name');
      expect(updatedProject.status).toBe('IN_PROGRESS');

      const projectInDb = await prisma.project.findUnique({ where: { id: project.id } });
      expect(projectInDb.name).toBe('New Name');
      expect(projectInDb.status).toBe('IN_PROGRESS');
    });

    it('should throw ApiError (404) if project not found', async () => {
      await expect(projectService.updateProjectById('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Project not found')
      );
    });
  });

  describe('deleteProjectById', () => {
    it('should delete a project by ID', async () => {
      const project = await projectService.createProject({ name: 'To Delete' }, regularUser.id);
      await projectService.deleteProjectById(project.id);

      const fetchedProject = await prisma.project.findUnique({ where: { id: project.id } });
      expect(fetchedProject).toBeNull();
    });

    it('should throw ApiError (404) if project not found', async () => {
      await expect(projectService.deleteProjectById('non-existent-id')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Project not found')
      );
    });
  });
});
```