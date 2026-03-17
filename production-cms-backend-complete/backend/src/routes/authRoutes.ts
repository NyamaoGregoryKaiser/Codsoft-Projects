import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../entities/User';
import { validateBody, CreateUserDto, LoginUserDto } from '../utils/validation';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [ADMIN, EDITOR, VIEWER]
 *                 description: Only Admin can set roles other than VIEWER.
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 */
router.post('/register', validateBody(CreateUserDto), authController.register.bind(authController));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateBody(LoginUserDto), authController.login.bind(authController));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Not authenticated
 */
router.get('/me', protect, authController.getMe.bind(authController));

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Not authorized (Admin required)
 */
router.get('/users', protect, authorize(UserRole.ADMIN), authController.getUsers.bind(authController));

/**
 * @swagger
 * /api/v1/auth/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User data
 *       403:
 *         description: Not authorized (Admin required)
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user by ID (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [ADMIN, EDITOR, VIEWER]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Not authorized (Admin required)
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       403:
 *         description: Not authorized (Admin required)
 *       404:
 *         description: User not found
 */
router.route('/users/:id')
    .get(protect, authorize(UserRole.ADMIN), authController.getUserById.bind(authController))
    .put(protect, authorize(UserRole.ADMIN), authController.updateUser.bind(authController))
    .delete(protect, authorize(UserRole.ADMIN), authController.deleteUser.bind(authController));

export default router;