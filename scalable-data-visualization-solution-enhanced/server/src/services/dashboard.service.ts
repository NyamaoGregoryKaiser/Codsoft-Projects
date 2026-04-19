```typescript
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { Dashboard, DashboardLayoutItem } from '../models/Dashboard';
import { Visualization } from '../models/Visualization';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';
import { z } from 'zod';

const dashboardLayoutItemSchema = z.object({
  i: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

const createDashboardSchema = z.object({
  name: z.string().min(3, 'Dashboard name must be at least 3 characters long'),
  description: z.string().optional(),
  layout: z.array(dashboardLayoutItemSchema).optional().default([]),
});

const updateDashboardSchema = z.object({
  name: z.string().min(3, 'Dashboard name must be at least 3 characters long').optional(),
  description: z.string().optional(),
  layout: z.array(dashboardLayoutItemSchema).optional(),
});

export const dashboardService = {
  /**
   * Creates a new dashboard.
   * @param userId ID of the user creating the dashboard.
   * @param dashboardData Dashboard creation data.
   * @returns The newly created dashboard.
   * @throws APIError if user not found or validation fails.
   */
  async createDashboard(userId: string, dashboardData: z.infer<typeof createDashboardSchema>): Promise<Dashboard> {
    const validatedData = createDashboardSchema.parse(dashboardData);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new APIError('User not found', 404);
    }

    const dashboardRepository = AppDataSource.getRepository(Dashboard);
    const dashboard = dashboardRepository.create({
      ...validatedData,
      user: user,
    });

    // Link visualizations if provided in layout
    if (validatedData.layout && validatedData.layout.length > 0) {
      const visualizationRepository = AppDataSource.getRepository(Visualization);
      const vizIds = validatedData.layout.map(item => item.i);
      const visualizations = await visualizationRepository.findBy({ id: In(vizIds), userId: userId });

      if (visualizations.length !== vizIds.length) {
        const foundVizIds = new Set(visualizations.map(v => v.id));
        const notFound = vizIds.filter(id => !foundVizIds.has(id));
        throw new APIError(`One or more visualizations not found or not owned by user: ${notFound.join(', ')}`, 400);
      }
      dashboard.visualizations = visualizations;
    }

    await dashboardRepository.save(dashboard);

    logger.info(`Dashboard created by user ${userId}: ${dashboard.name}`);
    return dashboard;
  },

  /**
   * Retrieves all dashboards for a specific user.
   * @param userId ID of the user.
   * @returns Array of dashboards (without full visualization details by default).
   */
  async getDashboardsByUserId(userId: string): Promise<Dashboard[]> {
    const dashboardRepository = AppDataSource.getRepository(Dashboard);
    const dashboards = await dashboardRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      relations: {
        visualizations: true // Only load visualization IDs and basic info for list
      },
      select: ['id', 'name', 'description', 'layout', 'createdAt', 'updatedAt', 'userId']
    });
    return dashboards;
  },

  /**
   * Retrieves a single dashboard by ID, including its associated visualizations.
   * @param dashboardId ID of the dashboard.
   * @param userId ID of the user requesting the dashboard (for authorization).
   * @param isAdmin Whether the user is an admin.
   * @returns The dashboard with full visualization objects.
   * @throws APIError if dashboard not found or unauthorized.
   */
  async getDashboardById(dashboardId: string, userId: string, isAdmin: boolean = false): Promise<Dashboard> {
    const dashboardRepository = AppDataSource.getRepository(Dashboard);
    const dashboard = await dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: {
        visualizations: {
          dataset: true // Load dataset details for each visualization
        }
      }
    });

    if (!dashboard) {
      throw new APIError('Dashboard not found', 404);
    }
    if (dashboard.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to access this dashboard', 403);
    }

    return dashboard;
  },

  /**
   * Updates an existing dashboard's details and layout.
   * @param dashboardId ID of the dashboard to update.
   * @param userId ID of the user updating (for authorization).
   * @param updateData Update data.
   * @param isAdmin Whether the user is an admin.
   * @returns The updated dashboard.
   * @throws APIError if dashboard not found, unauthorized, or validation fails.
   */
  async updateDashboard(dashboardId: string, userId: string, updateData: z.infer<typeof updateDashboardSchema>, isAdmin: boolean = false): Promise<Dashboard> {
    const validatedData = updateDashboardSchema.partial().parse(updateData);

    const dashboardRepository = AppDataSource.getRepository(Dashboard);
    const dashboard = await dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: { visualizations: true }
    });

    if (!dashboard) {
      throw new APIError('Dashboard not found', 404);
    }
    if (dashboard.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to update this dashboard', 403);
    }

    if (validatedData.layout !== undefined) {
      const visualizationRepository = AppDataSource.getRepository(Visualization);
      const newVizIds = validatedData.layout.map(item => item.i);

      // Fetch only the visualizations that are new or still referenced
      const visualizations = await visualizationRepository.findBy({ id: In(newVizIds), userId: userId });

      if (visualizations.length !== newVizIds.length) {
        const foundVizIds = new Set(visualizations.map(v => v.id));
        const notFound = newVizIds.filter(id => !foundVizIds.has(id));
        throw new APIError(`One or more visualizations not found or not owned by user: ${notFound.join(', ')}`, 400);
      }
      dashboard.visualizations = visualizations;
      dashboard.layout = validatedData.layout;
    }

    Object.assign(dashboard, { name: validatedData.name, description: validatedData.description });
    await dashboardRepository.save(dashboard);

    logger.info(`Dashboard updated by user ${userId}: ${dashboard.id}`);
    return dashboard;
  },

  /**
   * Deletes a dashboard.
   * @param dashboardId ID of the dashboard to delete.
   * @param userId ID of the user deleting (for authorization).
   * @param isAdmin Whether the user is an admin.
   * @throws APIError if dashboard not found or unauthorized.
   */
  async deleteDashboard(dashboardId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const dashboardRepository = AppDataSource.getRepository(Dashboard);
    const dashboard = await dashboardRepository.findOne({ where: { id: dashboardId } });

    if (!dashboard) {
      throw new APIError('Dashboard not found', 404);
    }
    if (dashboard.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to delete this dashboard', 403);
    }

    await dashboardRepository.remove(dashboard);
    logger.info(`Dashboard deleted by user ${userId}: ${dashboard.id}`);
  },
};

// Helper for TypeORM 'In' operator
function In<T>(values: T[]): any {
  return (builder: any) => {
    return builder.whereInIds(values);
  };
}
```