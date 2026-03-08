```javascript
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../../../src/utils/errorHandler');
const { projectService } = require('../../../src/services');
const { projectRepository } = require('../../../src/data-access/repositories');

jest.mock('../../../src/data-access/repositories');
jest.mock('uuid');

describe('Project Service', () => {
  const mockUserId = 'user-123';
  const mockProjectId = 'project-abc';
  const mockProjectBody = {
    name: 'My Test Project',
    description: 'A project for testing.',
  };
  const mockProject = {
    id: mockProjectId,
    user_id: mockUserId,
    name: mockProjectBody.name,
    description: mockProjectBody.description,
    api_key: 'mock-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    uuidv4.mockReturnValueOnce(mockProjectId).mockReturnValueOnce('mock-api-key'); // For createProject
  });

  describe('createProject', () => {
    it('should successfully create a new project', async () => {
      projectRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject(mockUserId, mockProjectBody);

      expect(uuidv4).toHaveBeenCalledTimes(2); // One for project ID, one for API key
      expect(projectRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUserId,
        name: mockProjectBody.name,
        api_key: 'mock-api-key',
      }));
      expect(result).toEqual(mockProject);
    });
  });

  describe('getProjectById', () => {
    it('should return a project if found and owned by user', async () => {
      projectRepository.findById.mockResolvedValue(mockProject);

      const result = await projectService.getProjectById(mockProjectId, mockUserId);

      expect(projectRepository.findById).toHaveBeenCalledWith(mockProjectId);
      expect(result).toEqual(mockProject);
    });

    it('should throw ApiError if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(projectService.getProjectById(mockProjectId, mockUserId)).rejects.toThrow(ApiError);
      await expect(projectService.getProjectById(mockProjectId, mockUserId)).rejects.toHaveProperty('statusCode', httpStatus.NOT_FOUND);
    });

    it('should throw ApiError if project found but not owned by user', async () => {
      const otherProject = { ...mockProject, user_id: 'other-user' };
      projectRepository.findById.mockResolvedValue(otherProject);

      await expect(projectService.getProjectById(mockProjectId, mockUserId)).rejects.toThrow(ApiError);
      await expect(projectService.getProjectById(mockProjectId, mockUserId)).rejects.toHaveProperty('statusCode', httpStatus.NOT_FOUND);
    });
  });

  describe('getProjectsByUserId', () => {
    it('should return all projects for a given user', async () => {
      const projects = [mockProject, { ...mockProject, id: 'project-def', name: 'Another Project' }];
      projectRepository.findByUserId.mockResolvedValue(projects);

      const result = await projectService.getProjectsByUserId(mockUserId);

      expect(projectRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(projects);
    });
  });

  describe('updateProject', () => {
    const updateBody = { name: 'Updated Project Name' };
    it('should update a project if found and owned by user', async () => {
      projectRepository.findById.mockResolvedValue(mockProject); // Check ownership
      projectRepository.update.mockResolvedValue({ ...mockProject, ...updateBody });

      const result = await projectService.updateProject(mockProjectId, mockUserId, updateBody);

      expect(projectRepository.findById).toHaveBeenCalledWith(mockProjectId);
      expect(projectRepository.update).toHaveBeenCalledWith(mockProjectId, updateBody);
      expect(result).toEqual({ ...mockProject, ...updateBody });
    });

    it('should throw ApiError if project not found or not owned for update', async () => {
      projectRepository.findById.mockResolvedValue(null); // Simulate not found/owned
      await expect(projectService.updateProject(mockProjectId, mockUserId, updateBody)).rejects.toThrow(ApiError);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project if found and owned by user', async () => {
      projectRepository.findById.mockResolvedValue(mockProject);
      projectRepository.remove.mockResolvedValue(true);

      const result = await projectService.deleteProject(mockProjectId, mockUserId);

      expect(projectRepository.findById).toHaveBeenCalledWith(mockProjectId);
      expect(projectRepository.remove).toHaveBeenCalledWith(mockProjectId);
      expect(result).toEqual({ message: 'Project deleted successfully' });
    });

    it('should throw ApiError if project not found or not owned for deletion', async () => {
      projectRepository.findById.mockResolvedValue(null);
      await expect(projectService.deleteProject(mockProjectId, mockUserId)).rejects.toThrow(ApiError);
    });
  });

  describe('generateNewApiKey', () => {
    const newApiKey = 'new-mock-api-key';
    it('should generate a new API key for a project', async () => {
      uuidv4.mockReturnValue(newApiKey); // For generateNewApiKey
      projectRepository.findById.mockResolvedValue(mockProject);
      projectRepository.update.mockResolvedValue({ ...mockProject, api_key: newApiKey });

      const result = await projectService.generateNewApiKey(mockProjectId, mockUserId);

      expect(projectRepository.findById).toHaveBeenCalledWith(mockProjectId);
      expect(uuidv4).toHaveBeenCalled();
      expect(projectRepository.update).toHaveBeenCalledWith(mockProjectId, { api_key: newApiKey });
      expect(result).toEqual(expect.objectContaining({ api_key: newApiKey }));
    });

    it('should throw ApiError if project not found or not owned for API key generation', async () => {
      projectRepository.findById.mockResolvedValue(null);
      await expect(projectService.generateNewApiKey(mockProjectId, mockUserId)).rejects.toThrow(ApiError);
    });
  });
});
```