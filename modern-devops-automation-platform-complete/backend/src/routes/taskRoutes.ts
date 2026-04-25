```typescript
import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware, authorizeOwner } from '../middlewares/authMiddleware';
import { AppDataSource } from '../data-source';
import { Project } from '../entities/Project';
import { Task } from '../entities/Task';
import { ForbiddenError, NotFoundError } from '../middlewares/errorHandler';

const router = Router();
const taskController = new TaskController();

// Helper to get task by ID and check ownership (via project owner) for authorizeOwner middleware
const getTaskByIdAndOwner = async (taskId: string, ownerId: string) => {
  const taskRepository = AppDataSource.getRepository(Task);
  const task = await taskRepository.findOne({
    where: { id: taskId, project: { owner: { id: ownerId } } },
    relations: ['project', 'project.owner'], // Ensure project owner is loaded for authorization
  });

  if (!task) {
    throw new NotFoundError(`Task with ID ${taskId} not found or you don't have access.`);
  }
  return task;
};

// Helper to get project by ID and check ownership for task creation/listing within a project
const getProjectForTaskCreation = async (projectId: string, ownerId: string) => {
  const projectRepository = AppDataSource.getRepository(Project);
  const project = await projectRepository.findOne({
    where: { id: projectId, owner: { id: ownerId } },
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found or you don't have access.`);
  }
  return project;
};


// Apply authMiddleware to all task routes
router.use(authMiddleware);

// Routes for tasks within a project (e.g., /api/projects/:projectId/tasks)
// Note: These routes are defined on a separate path than /api/tasks/:id,
// but handle tasks in context of a project.
router.post('/projects/:projectId/tasks', authorizeOwner(getProjectForTaskCreation), taskController.createTask.bind(taskController));
router.get('/projects/:projectId/tasks', authorizeOwner(getProjectForTaskCreation), taskController.getTasksByProjectId.bind(taskController));

// Standalone task routes (e.g., /api/tasks/:id)
router.get('/:id', authorizeOwner(getTaskByIdAndOwner), taskController.getTaskById.bind(taskController));
router.put('/:id', authorizeOwner(getTaskByIdAndOwner), taskController.updateTask.bind(taskController));
router.delete('/:id', authorizeOwner(getTaskByIdAndOwner), taskController.deleteTask.bind(taskController));

export default router;
```