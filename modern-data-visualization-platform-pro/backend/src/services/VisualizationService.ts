import { Repository } from 'typeorm';
import { Visualization, ChartType } from '@models/Visualization';
import { Dataset } from '@models/Dataset';
import { Dashboard } from '@models/Dashboard';
import { AppDataSource } from '@db/data-source';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';

interface VisualizationUpdatePayload {
  name?: string;
  description?: string;
  type?: ChartType;
  datasetId?: string;
  dashboardId?: string | null;
  config?: Record<string, any>;
}

/**
 * @class VisualizationService
 * @description Provides business logic for visualization-related operations and data processing.
 */
export class VisualizationService {
  private visualizationRepository: Repository<Visualization>;
  private datasetRepository: Repository<Dataset>;
  private dashboardRepository: Repository<Dashboard>;

  constructor() {
    this.visualizationRepository = AppDataSource.getRepository(Visualization);
    this.datasetRepository = AppDataSource.getRepository(Dataset);
    this.dashboardRepository = AppDataSource.getRepository(Dashboard);
  }

  /**
   * Creates a new visualization.
   * @param ownerId - The ID of the user creating the visualization.
   * @param name - The name of the visualization.
   * @param description - An optional description.
   * @param type - The type of chart (e.g., 'bar', 'line').
   * @param datasetId - The ID of the dataset to use.
   * @param dashboardId - Optional ID of the dashboard to link this visualization to.
   * @param config - JSON configuration for the chart (e.g., axes, labels).
   * @returns The newly created Visualization object.
   * @throws {AppError} If the dataset or dashboard is not found or not owned by the user.
   */
  public async createVisualization(
    ownerId: string,
    name: string,
    description: string = '',
    type: ChartType,
    datasetId: string,
    dashboardId: string | null = null,
    config: Record<string, any>
  ): Promise<Visualization> {
    const dataset = await this.datasetRepository.findOne({ where: { id: datasetId } });
    if (!dataset) {
      throw new AppError('Dataset not found.', 404);
    }
    if (dataset.ownerId !== ownerId) {
      throw new AppError('Forbidden: You do not own this dataset.', 403);
    }

    let dashboard: Dashboard | null = null;
    if (dashboardId) {
      dashboard = await this.dashboardRepository.findOne({ where: { id: dashboardId } });
      if (!dashboard) {
        throw new AppError('Dashboard not found.', 404);
      }
      if (dashboard.ownerId !== ownerId) {
        throw new AppError('Forbidden: You do not own this dashboard.', 403);
      }
    }

    const newVisualization = this.visualizationRepository.create({
      ownerId,
      name,
      description,
      type,
      config,
      dataset,
      dashboard: dashboard || undefined, // Link to dashboard if provided
    });

    await this.visualizationRepository.save(newVisualization);
    logger.info(`Visualization ${newVisualization.id} created for user ${ownerId}`);
    return newVisualization;
  }

  /**
   * Retrieves a specific visualization by its ID.
   * @param id - The ID of the visualization.
   * @returns The Visualization object, or null if not found.
   */
  public async getVisualizationById(id: string): Promise<Visualization | null> {
    return this.visualizationRepository.findOne({
      where: { id },
      relations: ['dataset', 'dashboard'], // Include dataset and dashboard for ownership check and data processing
    });
  }

  /**
   * Retrieves a specific visualization by its ID, specifically with its dataset.
   * @param id - The ID of the visualization.
   * @returns The Visualization object with its dataset, or null if not found.
   */
  public async getVisualizationByIdWithDataset(id: string): Promise<Visualization | null> {
    return this.visualizationRepository.findOne({
      where: { id },
      relations: ['dataset', 'dashboard'], // Need dashboard for owner check too
    });
  }

  /**
   * Updates an existing visualization.
   * @param id - The ID of the visualization to update.
   * @param ownerId - The ID of the user attempting the update (for authorization).
   * @param payload - An object containing fields to update.
   * @returns The updated Visualization object, or null if not found/owned.
   * @throws {AppError} If visualization, dataset or dashboard is not found or not owned by the user.
   */
  public async updateVisualization(id: string, ownerId: string, payload: VisualizationUpdatePayload): Promise<Visualization | null> {
    const visualization = await this.visualizationRepository.findOne({
      where: { id },
      relations: ['dataset', 'dashboard']
    });

    if (!visualization) {
      throw new AppError('Visualization not found.', 404);
    }
    // Check ownership of visualization OR associated dashboard
    if (visualization.ownerId !== ownerId && (!visualization.dashboard || visualization.dashboard.ownerId !== ownerId)) {
      throw new AppError('Forbidden: You do not own this visualization or its dashboard.', 403);
    }

    if (payload.name) visualization.name = payload.name;
    if (payload.description !== undefined) visualization.description = payload.description;
    if (payload.type) visualization.type = payload.type;
    if (payload.config) visualization.config = payload.config;

    // Handle dataset change
    if (payload.datasetId && payload.datasetId !== visualization.datasetId) {
      const newDataset = await this.datasetRepository.findOne({ where: { id: payload.datasetId } });
      if (!newDataset) {
        throw new AppError('New dataset not found.', 404);
      }
      if (newDataset.ownerId !== ownerId) {
        throw new AppError('Forbidden: You do not own the new dataset.', 403);
      }
      visualization.dataset = newDataset;
      visualization.datasetId = newDataset.id;
    }

    // Handle dashboard change
    if (payload.dashboardId !== undefined) {
      if (payload.dashboardId === null) {
        visualization.dashboard = null;
        visualization.dashboardId = null;
      } else if (payload.dashboardId !== visualization.dashboardId) {
        const newDashboard = await this.dashboardRepository.findOne({ where: { id: payload.dashboardId } });
        if (!newDashboard) {
          throw new AppError('New dashboard not found.', 404);
        }
        if (newDashboard.ownerId !== ownerId) {
          throw new AppError('Forbidden: You do not own the new dashboard.', 403);
        }
        visualization.dashboard = newDashboard;
        visualization.dashboardId = newDashboard.id;
      }
    }

    await this.visualizationRepository.save(visualization);
    logger.info(`Visualization ${id} updated by user ${ownerId}`);
    return visualization;
  }

  /**
   * Deletes a visualization.
   * @param id - The ID of the visualization to delete.
   * @param ownerId - The ID of the user attempting the deletion (for authorization).
   * @returns True if the visualization was deleted, false otherwise.
   * @throws {AppError} If visualization does not exist or not owned by the user.
   */
  public async deleteVisualization(id: string, ownerId: string): Promise<boolean> {
    const visualization = await this.visualizationRepository.findOne({
      where: { id },
      relations: ['dashboard']
    });

    if (!visualization) {
      return false; // Not found, so not deleted
    }
    // Check ownership of visualization OR associated dashboard
    if (visualization.ownerId !== ownerId && (!visualization.dashboard || visualization.dashboard.ownerId !== ownerId)) {
      throw new AppError('Forbidden: You do not own this visualization or its dashboard.', 403);
    }

    await this.visualizationRepository.remove(visualization);
    logger.info(`Visualization ${id} deleted by user ${ownerId}`);
    return true;
  }

  /**
   * Processes raw dataset data into a format suitable for various chart types
   * based on the visualization configuration.
   * This is a simplified example; a real-world scenario would have more complex
   * aggregation and transformation logic.
   * @param rawData - The raw dataset array of objects.
   * @param chartType - The type of chart.
   * @param config - The visualization configuration.
   * @returns Processed data, e.g., for Chart.js.
   * @throws {AppError} If configuration is invalid for the chart type.
   */
  public processVisualizationData(
    rawData: object[],
    chartType: ChartType,
    config: Record<string, any>
  ): Record<string, any> {
    if (!rawData || rawData.length === 0) {
      return { labels: [], datasets: [] };
    }

    switch (chartType) {
      case ChartType.Bar:
      case ChartType.Line:
        return this.processCategoricalChartData(rawData, config);
      case ChartType.Pie:
        return this.processPieChartData(rawData, config);
      case ChartType.Table:
        return this.processTableData(rawData, config);
      default:
        throw new AppError(`Unsupported chart type for processing: ${chartType}`, 400);
    }
  }

  /**
   * Processes data for bar and line charts.
   * Expects 'xAxis' (category field) and 'yAxis' (value field) in config.
   */
  private processCategoricalChartData(rawData: object[], config: Record<string, any>): Record<string, any> {
    const xAxisField = config.xAxis?.field;
    const yAxisField = config.yAxis?.field;

    if (!xAxisField || !yAxisField) {
      throw new AppError('Configuration for bar/line chart requires xAxis.field and yAxis.field', 400);
    }

    const labels: string[] = [];
    const dataValues: number[] = [];

    const aggregatedData: { [key: string]: number } = {};

    rawData.forEach((row: any) => {
      const xValue = row[xAxisField];
      const yValue = parseFloat(row[yAxisField]); // Ensure number type

      if (xValue !== undefined && !isNaN(yValue)) {
        aggregatedData[xValue] = (aggregatedData[xValue] || 0) + yValue;
      }
    });

    for (const key in aggregatedData) {
      labels.push(key);
      dataValues.push(aggregatedData[key]);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: config.yAxis.label || yAxisField,
          data: dataValues,
          backgroundColor: config.backgroundColor || 'rgba(75, 192, 192, 0.6)',
          borderColor: config.borderColor || 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  /**
   * Processes data for pie charts.
   * Expects 'labelField' and 'valueField' in config.
   */
  private processPieChartData(rawData: object[], config: Record<string, any>): Record<string, any> {
    const labelField = config.labelField;
    const valueField = config.valueField;

    if (!labelField || !valueField) {
      throw new AppError('Configuration for pie chart requires labelField and valueField', 400);
    }

    const labels: string[] = [];
    const dataValues: number[] = [];
    const aggregatedData: { [key: string]: number } = {};

    rawData.forEach((row: any) => {
      const label = row[labelField];
      const value = parseFloat(row[valueField]);

      if (label !== undefined && !isNaN(value)) {
        aggregatedData[label] = (aggregatedData[label] || 0) + value;
      }
    });

    for (const key in aggregatedData) {
      labels.push(key);
      dataValues.push(aggregatedData[key]);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: config.valueLabel || valueField,
          data: dataValues,
          backgroundColor: config.backgroundColor || ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          hoverBackgroundColor: config.hoverBackgroundColor || ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    };
  }

  /**
   * Processes data for table visualizations.
   * Returns raw data, potentially with limits or selected columns.
   */
  private processTableData(rawData: object[], config: Record<string, any>): Record<string, any> {
    const columns = config.columns || Object.keys(rawData[0] || {}); // If no columns specified, use all from first row
    const limit = config.limit || rawData.length;

    const tableRows = rawData.slice(0, limit).map((row: any) => {
      const newRow: Record<string, any> = {};
      columns.forEach((col: string) => {
        newRow[col] = row[col];
      });
      return newRow;
    });

    return {
      columns: columns.map((col: string) => ({ field: col, headerName: col, width: 150 })),
      rows: tableRows,
    };
  }
}