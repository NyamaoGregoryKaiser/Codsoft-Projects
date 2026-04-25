```javascript
// backend/src/routes/website.routes.js
const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/website.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createWebsiteSchema, updateWebsiteSchema } = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../middleware/cache.middleware'); // Caching example

/**
 * @swagger
 * tags:
 *   name: Websites
 *   description: Website management and configuration
 */

/**
 * @swagger
 * /websites:
 *   post:
 *     summary: Create a new website
 *     tags: [Websites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the website
 *                 example: "Wikipedia"
 *               url:
 *                 type: string
 *                 format: url
 *                 description: URL of the website
 *                 example: "https://www.wikipedia.org"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Optional description
 *                 example: "The free encyclopedia"
 *     responses:
 *       201:
 *         description: Website created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Website'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', auth(['admin', 'user']), validate(createWebsiteSchema), asyncHandler(websiteController.createWebsite));

/**
 * @swagger
 * /websites:
 *   get:
 *     summary: Retrieve a list of all websites
 *     tags: [Websites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of websites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 1
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Website'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', auth(['admin', 'user']), cache('websites', 60), asyncHandler(websiteController.getAllWebsites)); // Cache for 60 seconds

/**
 * @swagger
 * /websites/{id}:
 *   get:
 *     summary: Retrieve a single website by ID
 *     tags: [Websites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the website to retrieve
 *     responses:
 *       200:
 *         description: A single website object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Website'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', auth(['admin', 'user']), asyncHandler(websiteController.getWebsiteById));

/**
 * @swagger
 * /websites/{id}:
 *   put:
 *     summary: Update an existing website
 *     tags: [Websites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the website to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name of the website
 *                 example: "Wikipedia Official"
 *               url:
 *                 type: string
 *                 format: url
 *                 description: New URL of the website
 *                 example: "https://www.wikipedia.org"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: New description
 *                 example: "The collaborative encyclopedia"
 *     responses:
 *       200:
 *         description: Website updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Website'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', auth(['admin']), validate(updateWebsiteSchema), asyncHandler(websiteController.updateWebsite));

/**
 * @swagger
 * /websites/{id}:
 *   delete:
 *     summary: Delete a website
 *     tags: [Websites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the website to delete
 *     responses:
 *       204:
 *         description: Website deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', auth(['admin']), asyncHandler(websiteController.deleteWebsite));


// Common responses for Swagger
/**
 * @swagger
 * components:
 *   responses:
 *     Unauthorized:
 *       description: Authentication token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Unauthorized"
 *     Forbidden:
 *       description: User does not have the necessary permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Forbidden: You do not have permission to perform this action"
 *     NotFound:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Resource not found"
 *     BadRequest:
 *       description: Invalid request payload or parameters
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Invalid input data"
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     path:
 *                       type: string
 *                       example: "url"
 *                     message:
 *                       type: string
 *                       example: "\"url\" must be a valid uri"
 *     ServerError:
 *       description: An unexpected internal server error occurred
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Internal Server Error"
 */

module.exports = router;
```