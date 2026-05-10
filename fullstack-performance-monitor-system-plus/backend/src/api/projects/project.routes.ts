import { Router } from 'express';
import * as projectController from './project.controller';
import { protect, authorizeProjectAccess } from '../../middleware/auth';

const router = Router();

router.use(protect); // All project routes require authentication

router.route('/')
  .post(projectController.createProject)
  .get(projectController.getProjects);

router.route('/:projectId')
  .get(authorizeProjectAccess, projectController.getProject)
  .put(authorizeProjectAccess, projectController.updateProject)
  .delete(authorizeProjectAccess, projectController.deleteProject);

export { router as projectRouter };