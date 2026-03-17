import { Router } from 'express';
import { ContentController } from '../controllers/ContentController';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../entities/User';
import { validateBody, CreateContentDto, UpdateContentDto } from '../utils/validation';
import { ContentStatus } from '../entities/Content';

const router = Router();
const contentController = new ContentController();

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content (posts/articles) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCategoryDto:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *         description:
 *           type: string
 *     UpdateCategoryDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *         description:
 *           type: string
 *     CreateContentDto:
 *       type: object
 *       required:
 *         - title
 *         - body
 *         - categoryId
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *         body:
 *           type: string
 *           minLength: 20
 *         categoryId:
 *           type: string
 *           format: uuid
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *           default: DRAFT
 *         isFeatured:
 *           type: boolean
 *           default: false
 *     UpdateContentDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *         body:
 *           type: string
 *           minLength: 20
 *         categoryId:
 *           type: string
 *           format: uuid
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         isFeatured:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/content:
 *   post:
 *     summary: Create new content (Admin/Editor only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentDto'
 *     responses:
 *       201:
 *         description: Content created successfully
 *       400:
 *         description: Invalid input or category not found
 *       403:
 *         description: Not authorized
 *   get:
 *     summary: Get all content (can filter by status for Admin/Editor)
 *     tags: [Content]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *           description: Filter by content status. Requires Admin/Editor for DRAFT/ARCHIVED.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           description: Search content by title or body.
 *     responses:
 *       200:
 *         description: List of content
 */
router.route('/')
    .post(protect, authorize(UserRole.ADMIN, UserRole.EDITOR), validateBody(CreateContentDto), contentController.createContent.bind(contentController))
    .get(contentController.getContents.bind(contentController)); // Public can get content, but access to DRAFT/ARCHIVED might be restricted in service layer


/**
 * @swagger
 * /api/v1/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Content data
 *       404:
 *         description: Content not found
 *   put:
 *     summary: Update content by ID (Author/Admin/Editor only)
 *     tags: [Content]
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
 *             $ref: '#/components/schemas/UpdateContentDto'
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Content not found
 *   delete:
 *     summary: Delete content by ID (Author/Admin only)
 *     tags: [Content]
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
 *         description: Content deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Content not found
 */
router.route('/:id')
    .get(contentController.getContentById.bind(contentController))
    .put(protect, authorize(UserRole.ADMIN, UserRole.EDITOR), validateBody(UpdateContentDto), contentController.updateContent.bind(contentController))
    .delete(protect, authorize(UserRole.ADMIN, UserRole.EDITOR), contentController.deleteContent.bind(contentController)); // Author also needs to be checked in service

export default router;