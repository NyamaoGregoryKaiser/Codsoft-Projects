import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticate } from '../../middleware/auth';
import { TaskStatus, TaskPriority } from './task.entity';
import { cacheMiddleware } from '../../middleware/cache';

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TaskStatus:
 *       type: string
 *       enum: ['todo', 'in_progress', 'done']
 *       example: todo
 *     TaskPriority:
 *       type: string
 *       enum: ['low', 'medium', 'high']
 *       example: medium
 *     TaskResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         title: { type: string }
 *         description: { type: string, nullable: true }
 *         status: { $ref: '#/components/schemas/TaskStatus' }
 *         priority: { $ref: '#/components/schemas/TaskPriority' }
 *         projectId: { type: string, format: uuid }
 *         projectName: { type: string }
 *         assignedToId: { type: string, format: uuid, nullable: true }
 *         assignedToUsername: { type: string, nullable: true }
 *         createdById: { type: string, format: uuid }
 *         createdByUsername: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateTaskDto:
 *       type: object
 *       required: [title, projectId]
 *       properties:
 *         title: { type: string, example: "Implement User Login" }
 *         description: { type: string, example: "Create a secure login endpoint and frontend integration." }
 *         status: { $ref: '#/components/schemas/TaskStatus' }
 *         priority: { $ref: '#/components/schemas/TaskPriority' }
 *         projectId: { type: string, format: uuid, description: "ID of the project this task belongs to." }
 *         assignedToId: { type: string, format: uuid, nullable: true, description: "ID of the user assigned to this task." }
 *     UpdateTaskDto:
 *       type: object
 *       properties:
 *         title: { type: string, example: "Implement User Login Feature" }
 *         description: { type: string, example: "Updated description for login feature." }
 *         status: { $ref: '#/components/schemas/TaskStatus' }
 *         priority: { $ref: '#/components/schemas/TaskPriority' }
 *         assignedToId: { type: string, format: uuid, nullable: true, description: "ID of the user assigned to this task, or null to unassign." }
 */

router.use(authenticate); // All task routes require authentication

/**
 * @swagger
 * /api/v1/projects/{projectId}/tasks:
 *   get:
 *     summary: Get all tasks for a specific project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the project
 *     responses:
 *       200:
 *         description: A list of tasks for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new task within a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the project to create the task in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskDto'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project or assigned user not found
 *       500:
 *         description: Internal server error
 */
router.route('/projects/:projectId/tasks')
  .get(cacheMiddleware, taskController.getTasksByProjectId)
  .post(taskController.createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Task data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskDto'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not project creator, task creator or admin)
 *       404:
 *         description: Task or assigned user not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the task to delete
 *     responses:
 *       204:
 *         description: Task deleted successfully (No Content)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .get(cacheMiddleware, taskController.getTaskById)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

export default router;