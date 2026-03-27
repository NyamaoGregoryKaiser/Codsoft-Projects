import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate } from '../../middleware/auth';
import { cacheMiddleware } from '../../middleware/cache';

const router = Router();
const projectController = new ProjectController();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         createdById: { type: string, format: uuid }
 *         createdByUsername: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateProjectDto:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Website Redesign" }
 *         description: { type: string, example: "Redesign the company website for better UX and performance.", nullable: true }
 *     UpdateProjectDto:
 *       type: object
 *       properties:
 *         name: { type: string, example: "E-commerce Platform Relaunch" }
 *         description: { type: string, example: "Updated description for the project.", nullable: true }
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.use(authenticate); // All project routes require authentication

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectDto'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict (project name already exists)
 *       500:
 *         description: Internal server error
 */
router.route('/')
  .get(cacheMiddleware, projectController.getAllProjects)
  .post(projectController.createProject);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the project to retrieve
 *     responses:
 *       200:
 *         description: Project data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the project to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectDto'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not project creator or admin)
 *       404:
 *         description: Project not found
 *       409:
 *         description: Conflict (project name already exists)
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the project to delete
 *     responses:
 *       204:
 *         description: Project deleted successfully (No Content)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not project creator or admin)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .get(cacheMiddleware, projectController.getProjectById)
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

export default router;