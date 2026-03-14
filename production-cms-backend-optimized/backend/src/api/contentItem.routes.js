```javascript
const express = require('express');
const contentItemController = require('../controllers/contentItem.controller');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permission');
const { validate } = require('../middleware/validation');
const { createContentItemSchema, updateContentItemSchema } = require('../utils/validation/contentItem.schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Content Items
 *   description: Manage dynamic content items based on content types
 */

/**
 * @swagger
 * /api/content-items:
 *   get:
 *     summary: Get all content items (optionally filtered by contentTypeId)
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentTypeId
 *         schema:
 *           type: string
 *         description: ID of the content type to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: A list of content items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContentItem'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['read_content_items']),
  contentItemController.getAllContentItems
);

/**
 * @swagger
 * /api/content-items/{id}:
 *   get:
 *     summary: Get a content item by ID
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the content item to retrieve
 *     responses:
 *       200:
 *         description: Content item data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentItem'
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authMiddleware,
  permissionMiddleware(['read_content_items']),
  contentItemController.getContentItemById
);

/**
 * @swagger
 * /api/content-items:
 *   post:
 *     summary: Create a new content item
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentItem'
 *     responses:
 *       201:
 *         description: Content item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentItem'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['create_content_items']),
  validate(createContentItemSchema),
  contentItemController.createContentItem
);

/**
 * @swagger
 * /api/content-items/{id}:
 *   put:
 *     summary: Update an existing content item
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the content item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContentItem'
 *     responses:
 *       200:
 *         description: Content item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentItem'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware(['update_content_items']),
  validate(updateContentItemSchema),
  contentItemController.updateContentItem
);

/**
 * @swagger
 * /api/content-items/{id}:
 *   delete:
 *     summary: Delete a content item
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the content item to delete
 *     responses:
 *       204:
 *         description: Content item deleted successfully
 *       404:
 *         description: Content item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware(['delete_content_items']),
  contentItemController.deleteContentItem
);

module.exports = router;
```