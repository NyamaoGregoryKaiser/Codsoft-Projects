import { Router } from 'express';
import { DashboardController } from '@controllers/DashboardController';
import { authMiddleware } from '@middleware/auth';
import { authorizeOwner } from '@middleware/authorization';
import { Dashboard } from '@models/Dashboard';
import { cacheMiddleware } from '@middleware/cache';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @swagger
 * tags:
 *   name: Dashboards
 *   description: Dashboard management APIs
 */

/**
 * @swagger
 * /dashboards:
 *   post:
 *     summary: Create a new dashboard
 *     tags: [Dashboards]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the dashboard
 *               description:
 *                 type: string
 *                 description: Optional description
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, dashboardController.createDashboard);

/**
 * @swagger
 * /dashboards:
 *   get:
 *     summary: Get all dashboards for the authenticated user
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dashboards
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, dashboardController.getDashboards);

/**
 * @swagger
 * /dashboards/{id}:
 *   get:
 *     summary: Get a specific dashboard by ID
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dashboard to retrieve
 *     responses:
 *       200:
 *         description: Dashboard object with visualizations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dashboard
 *       404:
 *         description: Dashboard not found
 */
router.get('/:id', authMiddleware, authorizeOwner(Dashboard), cacheMiddleware(60), dashboardController.getDashboardById);

/**
 * @swagger
 * /dashboards/{id}:
 *   put:
 *     summary: Update an existing dashboard
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dashboard to update
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
 *     responses:
 *       200:
 *         description: Dashboard updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dashboard
 *       404:
 *         description: Dashboard not found
 */
router.put('/:id', authMiddleware, authorizeOwner(Dashboard), dashboardController.updateDashboard);

/**
 * @swagger
 * /dashboards/{id}:
 *   delete:
 *     summary: Delete a dashboard
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the dashboard to delete
 *     responses:
 *       204:
 *         description: Dashboard deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, user does not own this dashboard
 *       404:
 *         description: Dashboard not found
 */
router.delete('/:id', authMiddleware, authorizeOwner(Dashboard), dashboardController.deleteDashboard);

export default router;