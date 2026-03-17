import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../entities/User';
import { validateBody, CreateCategoryDto, UpdateCategoryDto } from '../utils/validation';

const router = Router();
const categoryController = new CategoryController();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Content category management
 */

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category (Admin/Editor only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryDto'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input or category already exists
 *       403:
 *         description: Not authorized
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
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
 *         description: List of categories
 */
router.route('/')
    .post(protect, authorize(UserRole.ADMIN, UserRole.EDITOR), validateBody(CreateCategoryDto), categoryController.createCategory.bind(categoryController))
    .get(categoryController.getCategories.bind(categoryController));

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category data
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update category by ID (Admin/Editor only)
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/UpdateCategoryDto'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Category not found
 *   delete:
 *     summary: Delete category by ID (Admin only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 *       403:
 *         description: Not authorized (Admin required)
 *       404:
 *         description: Category not found
 */
router.route('/:id')
    .get(categoryController.getCategoryById.bind(categoryController))
    .put(protect, authorize(UserRole.ADMIN, UserRole.EDITOR), validateBody(UpdateCategoryDto), categoryController.updateCategory.bind(categoryController))
    .delete(protect, authorize(UserRole.ADMIN), categoryController.deleteCategory.bind(categoryController));

export default router;