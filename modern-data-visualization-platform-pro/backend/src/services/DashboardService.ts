import { Repository } from 'typeorm';
import { Dashboard } from '@models/Dashboard';
import { AppDataSource } from '@db/data-source';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';

interface DashboardUpdatePayload {
  name?: string;
  description?: string;
}

/**
 * @class DashboardService
 * @description Provides business logic for dashboard-related operations.
 */
export class DashboardService {
  private dashboardRepository: Repository<Dashboard>;

  constructor() {
    this.dashboardRepository = AppDataSource.getRepository(Dashboard);
  }

  /**
   * Creates a new dashboard.
   * @param ownerId - The ID of the user who owns the dashboard.
   * @param name - The name of the dashboard.
   * @param description - An optional description for the dashboard.
   * @returns The newly created Dashboard object.
   */
  public async createDashboard(ownerId: string, name: string, description: string = ''): Promise<Dashboard> {
    const newDashboard = this.dashboardRepository.create({
      ownerId,
      name,
      description,
    });
    await this.dashboardRepository.save(newDashboard);
    logger.info(`Dashboard ${newDashboard.id} created for user ${ownerId}`);
    return newDashboard;
  }

  /**
   * Retrieves all dashboards owned by a specific user.
   * @param ownerId - The ID of the user.
   * @returns An array of Dashboard objects.
   */
  public async getDashboardsByUserId(ownerId: string): Promise<Dashboard[]> {
    return this.dashboardRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves a specific dashboard by its ID, including its associated visualizations.
   * @param id - The ID of the dashboard.
   * @returns The Dashboard object with visualizations, or null if not found.
   */
  public async getDashboardByIdWithVisualizations(id: string): Promise<Dashboard | null> {
    return this.dashboardRepository.findOne({
      where: { id },
      relations: ['visualizations'], // Eager load visualizations
    });
  }

  /**
   * Retrieves a specific dashboard by its ID. (without relations)
   * @param id - The ID of the dashboard.
   * @returns The Dashboard object, or null if not found.
   */
  public async getDashboardById(id: string): Promise<Dashboard | null> {
    return this.dashboardRepository.findOne({
      where: { id },
    });
  }

  /**
   * Updates an existing dashboard.
   * @param id - The ID of the dashboard to update.
   * @param ownerId - The ID of the user attempting the update (for authorization).
   * @param payload - An object containing fields to update (name, description).
   * @returns The updated Dashboard object, or null if the dashboard was not found or not owned by the user.
   * @throws {AppError} If the dashboard does not exist or does not belong to the user.
   */
  public async updateDashboard(id: string, ownerId: string, payload: DashboardUpdatePayload): Promise<Dashboard | null> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });

    if (!dashboard) {
      throw new AppError('Dashboard not found.', 404);
    }
    if (dashboard.ownerId !== ownerId) {
      throw new AppError('Forbidden: You do not own this dashboard.', 403);
    }

    if (payload.name) dashboard.name = payload.name;
    if (payload.description !== undefined) dashboard.description = payload.description;

    await this.dashboardRepository.save(dashboard);
    logger.info(`Dashboard ${id} updated by user ${ownerId}`);
    return dashboard;
  }

  /**
   * Deletes a dashboard.
   * @param id - The ID of the dashboard to delete.
   * @param ownerId - The ID of the user attempting the deletion (for authorization).
   * @returns True if the dashboard was deleted, false otherwise.
   * @throws {AppError} If the dashboard does not exist or does not belong to the user.
   */
  public async deleteDashboard(id: string, ownerId: string): Promise<boolean> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });

    if (!dashboard) {
      return false; // Not found, so not deleted
    }
    if (dashboard.ownerId !== ownerId) {
      throw new AppError('Forbidden: You do not own this dashboard.', 403);
    }

    // TypeORM's cascade delete for visualizations would handle dependent visualizations
    await this.dashboardRepository.remove(dashboard);
    logger.info(`Dashboard ${id} deleted by user ${ownerId}`);
    return true;
  }
}