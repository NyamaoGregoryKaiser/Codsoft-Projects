import { Router } from 'express';
import { DatasetController } from '@controllers/DatasetController';
import { authMiddleware } from '@middleware/auth';
import { authorizeOwner } from '@middleware/authorization';
import { Dataset } from '@models/Dataset';

const router = Router();
const datasetController = new DatasetController();

/**
 * @swagger
 * tags:
 *   name: Datasets
 *   description: Dataset management APIs
 */

/**
 * @swagger
 * /datasets:
 *   post:
 *     summary: Upload a new dataset
 *     tags: [Datasets]
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
 *               - data
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the dataset
 *               description:
 *                 type: string
 *                 description: Optional description
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of JSON objects representing dataset rows
 *     responses:
 *       201:
 *         description: Dataset uploaded successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, datasetController.uploadDataset);

/**
 * @swagger
 * /datasets:
 *   get:
 *     summary: Get all datasets for the authenticated user
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of datasets
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, datasetController.getDatasets);

/**
 * @swagger
 * /datasets/{id}:
 *   get:
 *     summary: Get a specific dataset by ID
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dataset to retrieve
 *     responses:
 *       200:
 *         description: Dataset object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dataset
 *       404:
 *         description: Dataset not found
 */
router.get('/:id', authMiddleware, authorizeOwner(Dataset), datasetController.getDatasetById);

/**
 * @swagger
 * /datasets/{id}:
 *   put:
 *     summary: Update an existing dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dataset to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Dataset updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dataset
 *       404:
 *         description: Dataset not found
 */
router.put('/:id', authMiddleware, authorizeOwner(Dataset), datasetController.updateDataset);

/**
 * @swagger
 * /datasets/{id}:
 *   delete:
 *     summary: Delete a dataset
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dataset to delete
 *     responses:
 *       204:
 *         description: Dataset deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dataset
 *       404:
 *         description: Dataset not found
 */
router.delete('/:id', authMiddleware, authorizeOwner(Dataset), datasetController.deleteDataset);

/**
 * @swagger
 * /datasets/{id}/preview:
 *   get:
 *     summary: Get a preview of a dataset's data
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dataset to preview
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of rows to return for preview
 *     responses:
 *       200:
 *         description: Array of dataset rows
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dataset
 *       404:
 *         description: Dataset not found
 */
router.get('/:id/preview', authMiddleware, authorizeOwner(Dataset), datasetController.getDatasetPreview);

export default router;