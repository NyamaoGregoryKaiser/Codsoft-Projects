import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication operations
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
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's chosen username
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 6 characters)
 *                 example: strongpassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     username: { type: string }
 *                     email: { type: string }
 *                     role: { type: string, enum: ['admin', 'member'] }
 *       400:
 *         description: Bad request (e.g., missing fields, weak password)
 *       409:
 *         description: Conflict (e.g., user with email/username already exists)
 *       500:
 *         description: Internal server error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in an existing user
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
 *                 description: User's email address
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: adminpassword123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     username: { type: string }
 *                     email: { type: string }
 *                     role: { type: string, enum: ['admin', 'member'] }
 *       401:
 *         description: Unauthorized (e.g., invalid credentials)
 *       400:
 *         description: Bad request (e.g., missing fields)
 *       500:
 *         description: Internal server error
 */
router.post('/login', authController.login);

export default router;