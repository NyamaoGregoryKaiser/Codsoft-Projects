```typescript
import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { authMiddleware, authorizeOwner } from '../middlewares/authMiddleware';
import { AppDataSource } from '../data-source';
import { Project } from '../entities/Project';
import { ForbiddenError, NotFoundError } from '../middlewares/errorHandler';
import { getRedisClient } from '../utils/redisClient';
import { logger } from '../utils/logger';

const router = Router();
const projectController = new ProjectController();

// Helper to get project by ID and check ownership for authorizeOwner middleware
const getProjectByIdAndOwner = async (projectId: string, ownerId: string) => {
  const projectRepository = AppDataSource.getRepository(Project);
  const project = await projectRepository.findOne({
    where: { id: projectId, owner: { id: ownerId } },
    relations: ['owner'],
  });

  if (!project) {
    // For security, it's often better to say not found than to reveal existence without access
    throw new NotFoundError(`Project with ID ${projectId} not found or you don't have access.`);
  }
  return project;
};

// Apply authMiddleware to all project routes
router.use(authMiddleware);

// Cache middleware for GET /projects
router.get('/', async (req, res, next) => {
  if (!req.user?.id) {
    return next(new ForbiddenError('User not authenticated for fetching projects.'));
  }
  const cacheKey = `projects:user:${req.user.id}`;
  const redisClient = getRedisClient();

  try {
    const cachedProjects = await redisClient.get(cacheKey);
    if (cachedProjects) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.status(StatusCodes.OK).json(JSON.parse(cachedProjects));
    }
    logger.debug(`Cache miss for ${cacheKey}`);
    res.on('finish', async () => {
      // Cache the response after it's sent
      if (res.statusCode === StatusCodes.OK && (res as any).body) { // Check if body was set by controller
        await redisClient.set(cacheKey, JSON.stringify((res as any).body), { EX: 60 }); // Cache for 60 seconds
        logger.debug(`Cached ${cacheKey}`);
      }
    });
    next(); // Proceed to controller if not cached
  } catch (error) {
    logger.error(`Redis caching error for ${cacheKey}:`, error);
    next(); // Proceed to controller in case of Redis error
  }
}, projectController.getProjects.bind(projectController));


router.post('/', projectController.createProject.bind(projectController));

router.get('/:id', authorizeOwner(getProjectByIdAndOwner), projectController.getProjectById.bind(projectController));
router.put('/:id', authorizeOwner(getProjectByIdAndOwner), projectController.updateProject.bind(projectController));
router.delete('/:id', authorizeOwner(getProjectByIdAndOwner), projectController.deleteProject.bind(projectController));

export default router;
```