import request from 'supertest';
import express from 'express';
import { ProjectService } from '../../services/project.service';
import projectRoutes from '../../routes/project.routes';
import { authMiddleware } from '../../middleware/auth.middleware';
import { UserRole } from '../../models/User.entity';
import { HttpException } from '../../utils/http-exception';
import { errorMiddleware } from '../../middleware/error.middleware';
import { cacheMiddleware, clearCache } from '../../middleware/cache.middleware';

// Mock ProjectService
jest.mock('../../services/project.service');
const mockProjectService = new ProjectService() as jest.Mocked<ProjectService>;

// Mock cache middleware and clearCache
jest.mock('../../middleware/cache.middleware', () => ({
  cacheMiddleware: jest.fn(() => (req, res, next) => next()), // bypass cache for tests
  clearCache: jest.fn(),
}));

// Setup a minimal Express app for testing routes with auth and error middleware
const app = express();
app.use(express.json());

// Mock auth middleware for integration tests
const mockAuth = (roles: UserRole[] = []) => (req: any, res: any, next: jest.Mock) => {
  req.user = { id: 'test-user-id', email: 'test@example.com', role: roles.includes(UserRole.ADMIN) ? UserRole.ADMIN : UserRole.USER };
  next();
};
// Use the mockAuth for all routes that require it
app.use('/api/projects', mockAuth([UserRole.USER, UserRole.ADMIN]), projectRoutes);
app.use(errorMiddleware); // Global error handler

describe('ProjectController Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    it('should create a project and return 201', async () => {
      const projectData = { name: 'New Project', description: 'A test project.' };
      const mockProject = { id: 'proj-1', ownerId: 'test-user-id', ...projectData };
      mockProjectService.createProject.mockResolvedValue(mockProject as any);

      const response = await request(app)
        .post('/api/projects')
        .send(projectData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockProject);
      expect(mockProjectService.createProject).toHaveBeenCalledWith(projectData, 'test-user-id');
      expect(clearCache).toHaveBeenCalledWith('/api/projects');
    });

    it('should return 400 for invalid project data', async () => {
      const invalidProjectData = { name: 'ab', description: 123 }; // Name too short, description wrong type
      const response = await request(app)
        .post('/api/projects')
        .send(invalidProjectData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('Project name must be at least 3 characters long');
      expect(mockProjectService.createProject).not.toHaveBeenCalled();
    });

    it('should return 500 for service errors', async () => {
      const projectData = { name: 'Error Project', description: 'Error test.' };
      mockProjectService.createProject.mockRejectedValue(new Error('DB connection failed'));

      const response = await request(app)
        .post('/api/projects')
        .send(projectData);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Failed to create project.');
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects and 200', async () => {
      const mockProjects = [
        { id: 'p1', name: 'Project One', owner: { id: 'o1', firstName: 'Owner', lastName: 'One' } },
        { id: 'p2', name: 'Project Two', owner: { id: 'o2', firstName: 'Owner', lastName: 'Two' } },
      ];
      mockProjectService.findAllProjects.mockResolvedValue(mockProjects as any);

      const response = await request(app)
        .get('/api/projects');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockProjects);
      expect(mockProjectService.findAllProjects).toHaveBeenCalled();
    });

    it('should handle service errors with 500', async () => {
      mockProjectService.findAllProjects.mockRejectedValue(new Error('Failed to fetch'));

      const response = await request(app)
        .get('/api/projects');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Failed to retrieve projects.');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a single project by ID and 200', async () => {
      const projectId = 'proj-123';
      const mockProject = { id: projectId, name: 'Specific Project', owner: { id: 'o1', firstName: 'Owner', lastName: 'One' } };
      mockProjectService.findProjectById.mockResolvedValue(mockProject as any);

      const response = await request(app)
        .get(`/api/projects/${projectId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockProject);
      expect(mockProjectService.findProjectById).toHaveBeenCalledWith(projectId);
    });

    it('should return 404 if project not found', async () => {
      const projectId = 'non-existent-proj';
      mockProjectService.findProjectById.mockRejectedValue(new HttpException(404, `Project with ID ${projectId} not found.`));

      const response = await request(app)
        .get(`/api/projects/${projectId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe(`Project with ID ${projectId} not found.`);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project and return 200', async () => {
      const projectId = 'proj-123';
      const updateData = { description: 'Updated description.' };
      const updatedProject = { id: projectId, name: 'Project Name', description: 'Updated description.', owner: { id: 'test-user-id' } };
      mockProjectService.updateProject.mockResolvedValue(updatedProject as any);

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(updatedProject);
      expect(mockProjectService.updateProject).toHaveBeenCalledWith(projectId, updateData, 'test-user-id', UserRole.USER);
      expect(clearCache).toHaveBeenCalledWith(`/api/projects/${projectId}`);
      expect(clearCache).toHaveBeenCalledWith('/api/projects');
    });

    it('should return 403 if user is not authorized', async () => {
      const projectId = 'proj-123';
      const updateData = { description: 'Updated description.' };
      mockProjectService.updateProject.mockRejectedValue(new HttpException(403, 'Forbidden: You do not have permission to update this project.'));

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send(updateData);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('Forbidden: You do not have permission to update this project.');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project and return 204', async () => {
      const projectId = 'proj-123';
      mockProjectService.deleteProject.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/projects/${projectId}`);

      expect(response.statusCode).toBe(204);
      expect(mockProjectService.deleteProject).toHaveBeenCalledWith(projectId, 'test-user-id', UserRole.USER);
      expect(clearCache).toHaveBeenCalledWith(`/api/projects/${projectId}`);
      expect(clearCache).toHaveBeenCalledWith('/api/projects');
    });

    it('should return 404 if project to delete not found', async () => {
      const projectId = 'non-existent-proj';
      mockProjectService.deleteProject.mockRejectedValue(new HttpException(404, `Project with ID ${projectId} not found.`));

      const response = await request(app)
        .delete(`/api/projects/${projectId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe(`Project with ID ${projectId} not found.`);
    });
  });
});