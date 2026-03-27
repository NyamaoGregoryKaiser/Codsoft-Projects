import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from './user.entity';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations (Admin only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         username: { type: string }
 *         email: { type: string, format: email }
 *         role: { type: string, enum: ['admin', 'member'] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateUserDto:
 *       type: object
 *       required: [username, email, password, role]
 *       properties:
 *         username: { type: string, example: janedoe }
 *         email: { type: string, format: email, example: jane.doe@example.com }
 *         password: { type: string, format: password, example: newpassword123 }
 *         role: { type: string, enum: ['admin', 'member'], example: member }
 *     UpdateUserDto:
 *       type: object
 *       properties:
 *         username: { type: string, example: janedoe_updated }
 *         email: { type: string, format: email, example: jane.doe.updated@example.com }
 *         password: { type: string, format: password, example: newerpassword123 }
 *         role: { type: string, enum: ['admin', 'member'], example: admin }
 */

router.use(authenticate); // All user routes require authentication
router.use(authorize([UserRole.ADMIN])); // All user routes require ADMIN role

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin role)
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDto'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict (user already exists)
 *       500:
 *         description: Internal server error
 */
router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict (email/username already in use)
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to delete
 *     responses:
 *       204:
 *         description: User deleted successfully (No Content)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

export default router;