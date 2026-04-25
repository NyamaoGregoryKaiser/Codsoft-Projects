import { Router } from 'express';
import { VisualizationController } from '@controllers/VisualizationController';
import { authMiddleware } from '@middleware/auth';
import { authorizeOwner } from '@middleware/authorization';
import { Visualization } from '@models/Visualization';

const router = Router();
const visualizationController = new VisualizationController();

/**
 * @swagger
 * tags:
 *   name: Visualizations
 *   description: Visualization management APIs
 */

/**
 * @swagger
 * /visualizations:
 *   post:
 *     summary: Create a new visualization
 *     tags: [Visualizations]
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
 *               - type
 *               - datasetId
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the visualization
 *               description:
 *                 type: string
 *                 description: Optional description
 *               type:
 *                 type: string
 *                 enum: [bar, line, pie, table]
 *                 description: Type of the visualization
 *               datasetId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the dataset used for this visualization
 *               dashboardId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional ID of the dashboard to attach this visualization to
 *               config:
 *                 type: object
 *                 description: JSON object with chart-specific configuration (e.g., xAxis, yAxis)
 *     responses:
 *       201:
 *         description: Visualization created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dataset or Dashboard not found
 */
router.post('/', authMiddleware, visualizationController.createVisualization);

/**
 * @swagger
 * /visualizations/{id}:
 *   get:
 *     summary: Get a specific visualization by ID
 *     tags: [Visualizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the visualization to retrieve
 *     responses:
 *       200:
 *         description: Visualization object with its dataset and processed data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this visualization (or its dashboard)
 *       404:
 *         description: Visualization not found
 */
router.get('/:id', authMiddleware, authorizeOwner(Visualization), visualizationController.getVisualizationById);

/**
 * @swagger
 * /visualizations/{id}/data:
 *   get:
 *     summary: Get processed data for a specific visualization
 *     tags: [Visualizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the visualization to get data for
 *     responses:
 *       200:
 *         description: Processed data suitable for charting
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this visualization (or its dashboard)
 *       404:
 *         description: Visualization not found
 */
router.get('/:id/data', authMiddleware, authorizeOwner(Visualization), visualizationController.getVisualizationData);

/**
 * @swagger
 * /visualizations/{id}:
 *   put:
 *     summary: Update an existing visualization
 *     tags: [Visualizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the visualization to update
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
 *               type:
 *                 type: string
 *                 enum: [bar, line, pie, table]
 *               datasetId:
 *                 type: string
 *                 format: uuid
 *               dashboardId:
 *                 type: string
 *                 format: uuid
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Visualization updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this visualization (or its dashboard)
 *       404:
 *         description: Visualization, Dataset, or Dashboard not found
 */
router.put('/:id', authMiddleware, authorizeOwner(Visualization), visualizationController.updateVisualization);

/**
 * @swagger
 * /visualizations/{id}:
 *   delete:
 *     summary: Delete a visualization
 *     tags: [Visualizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the visualization to delete
 *     responses:
 *       204:
 *         description: Visualization deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this visualization (or its dashboard)
 *       404:
 *         description: Visualization not found
 */
router.delete('/:id', authMiddleware, authorizeOwner(Visualization), visualizationController.deleteVisualization);


export default router;