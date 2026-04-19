```typescript
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { Dataset } from '../models/Dataset';
import { Visualization, ChartType, ChartConfig } from '../models/Visualization';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { datasetService } from './dataset.service'; // To parse raw data

const chartConfigSchema: z.ZodType<ChartConfig> = z.object({
  labelsField: z.string().min(1, 'Labels field is required'),
  dataField: z.string().min(1, 'Data field is required'),
  title: z.string().optional(),
  backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderWidth: z.number().int().min(0).optional(),
});

const createVisualizationSchema = z.object({
  name: z.string().min(3, 'Visualization name must be at least 3 characters long'),
  description: z.string().optional(),
  datasetId: z.string().uuid(),
  chartType: z.nativeEnum(ChartType),
  config: chartConfigSchema,
});

const updateVisualizationSchema = z.object({
  name: z.string().min(3, 'Visualization name must be at least 3 characters long').optional(),
  description: z.string().optional(),
  datasetId: z.string().uuid().optional(),
  chartType: z.nativeEnum(ChartType).optional(),
  config: chartConfigSchema.partial().optional(),
});

export const visualizationService = {
  /**
   * Creates a new visualization.
   * @param userId ID of the user creating the visualization.
   * @param vizData Visualization creation data.
   * @returns The newly created visualization.
   * @throws APIError if user/dataset not found or validation fails.
   */
  async createVisualization(userId: string, vizData: z.infer<typeof createVisualizationSchema>): Promise<Visualization> {
    const validatedData = createVisualizationSchema.parse(vizData);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new APIError('User not found', 404);
    }

    const datasetRepository = AppDataSource.getRepository(Dataset);
    const dataset = await datasetRepository.findOne({ where: { id: validatedData.datasetId, userId: userId } });
    if (!dataset) {
      throw new APIError('Dataset not found or not owned by user', 404);
    }

    const visualizationRepository = AppDataSource.getRepository(Visualization);
    const visualization = visualizationRepository.create({
      ...validatedData,
      user: user,
      dataset: dataset,
    });
    await visualizationRepository.save(visualization);

    logger.info(`Visualization created by user ${userId}: ${visualization.name}`);
    return visualization;
  },

  /**
   * Retrieves all visualizations for a specific user.
   * @param userId ID of the user.
   * @returns Array of visualizations.
   */
  async getVisualizationsByUserId(userId: string): Promise<Visualization[]> {
    const visualizationRepository = AppDataSource.getRepository(Visualization);
    const visualizations = await visualizationRepository.find({
      where: { userId: userId },
      relations: { dataset: true },
      order: { createdAt: 'DESC' },
      select: [
        'id', 'name', 'description', 'chartType', 'config',
        'createdAt', 'updatedAt', 'userId', 'datasetId',
        'dataset' // Include basic dataset info
      ]
    });
    return visualizations;
  },

  /**
   * Retrieves a single visualization by ID.
   * @param vizId ID of the visualization.
   * @param userId ID of the user requesting (for authorization).
   * @param isAdmin Whether the user is an admin.
   * @returns The visualization with its dataset.
   * @throws APIError if visualization not found or unauthorized.
   */
  async getVisualizationById(vizId: string, userId: string, isAdmin: boolean = false): Promise<Visualization> {
    const visualizationRepository = AppDataSource.getRepository(Visualization);
    const visualization = await visualizationRepository.findOne({
      where: { id: vizId },
      relations: { dataset: true },
    });

    if (!visualization) {
      throw new APIError('Visualization not found', 404);
    }
    if (visualization.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to access this visualization', 403);
    }

    return visualization;
  },

  /**
   * Updates an existing visualization.
   * @param vizId ID of the visualization to update.
   * @param userId ID of the user updating (for authorization).
   * @param updateData Update data.
   * @param isAdmin Whether the user is an admin.
   * @returns The updated visualization.
   * @throws APIError if visualization not found, unauthorized, or validation fails.
   */
  async updateVisualization(vizId: string, userId: string, updateData: z.infer<typeof updateVisualizationSchema>, isAdmin: boolean = false): Promise<Visualization> {
    const validatedData = updateVisualizationSchema.partial().parse(updateData);

    const visualizationRepository = AppDataSource.getRepository(Visualization);
    const visualization = await visualizationRepository.findOne({ where: { id: vizId } });

    if (!visualization) {
      throw new APIError('Visualization not found', 404);
    }
    if (visualization.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to update this visualization', 403);
    }

    if (validatedData.datasetId && validatedData.datasetId !== visualization.datasetId) {
      const datasetRepository = AppDataSource.getRepository(Dataset);
      const newDataset = await datasetRepository.findOne({ where: { id: validatedData.datasetId, userId: userId } });
      if (!newDataset) {
        throw new APIError('New dataset not found or not owned by user', 404);
      }
      visualization.dataset = newDataset;
      visualization.datasetId = newDataset.id;
    }

    // Merge config
    if (validatedData.config) {
      visualization.config = { ...visualization.config, ...validatedData.config };
    }

    Object.assign(visualization, {
      name: validatedData.name,
      description: validatedData.description,
      chartType: validatedData.chartType,
    });

    await visualizationRepository.save(visualization);

    logger.info(`Visualization updated by user ${userId}: ${visualization.id}`);
    return visualization;
  },

  /**
   * Deletes a visualization.
   * @param vizId ID of the visualization to delete.
   * @param userId ID of the user deleting (for authorization).
   * @param isAdmin Whether the user is an admin.
   * @throws APIError if visualization not found or unauthorized.
   */
  async deleteVisualization(vizId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const visualizationRepository = AppDataSource.getRepository(Visualization);
    const visualization = await visualizationRepository.findOne({ where: { id: vizId } });

    if (!visualization) {
      throw new APIError('Visualization not found', 404);
    }
    if (visualization.userId !== userId && !isAdmin) {
      throw new APIError('Unauthorized to delete this visualization', 403);
    }

    await visualizationRepository.remove(visualization);
    logger.info(`Visualization deleted by user ${userId}: ${visualization.id}`);
  },

  /**
   * Processes raw dataset data into a format suitable for Chart.js based on visualization config.
   * This is a simplified example; a real system would have more robust data transformations.
   * @param visualization The visualization object with config and dataset.
   * @returns Processed data object for Chart.js or an array for tables.
   */
  async processDataForChart(visualization: Visualization): Promise<any> {
    if (!visualization.dataset || !visualization.dataset.data) {
      throw new APIError('Visualization has no associated dataset data', 400);
    }

    let parsedData: any[] = [];
    if (visualization.dataset.fileType === ChartType.TABLE) { // Special handling for table type
      parsedData = await datasetService.parseCsvData(visualization.dataset.data); // Assuming tables usually come from CSV
    } else if (visualization.dataset.fileType === 'csv') {
      parsedData = await datasetService.parseCsvData(visualization.dataset.data);
    } else if (visualization.dataset.fileType === 'json') {
      parsedData = await datasetService.parseJsonData(visualization.dataset.data);
    } else {
      throw new APIError(`Unsupported file type for visualization: ${visualization.dataset.fileType}`, 400);
    }

    // If the chartType is 'table', return the raw parsed data array
    if (visualization.chartType === ChartType.TABLE) {
      return parsedData;
    }

    // For other chart types, process data according to config
    const { labelsField, dataField, title, backgroundColor, borderColor, borderWidth } = visualization.config;

    if (!labelsField || !dataField) {
      throw new APIError('Chart config missing labelsField or dataField', 400);
    }

    const labels = parsedData.map(item => item[labelsField]);
    const data = parsedData.map(item => parseFloat(item[dataField]));

    // Basic color generation if not provided
    const defaultColors = ['#42a5f5', '#66bb6a', '#ef5350', '#ffeb3b', '#ab47bc', '#78909c'];
    const resolvedBackgroundColor = backgroundColor || (visualization.chartType === ChartType.PIE || visualization.chartType === ChartType.DOUGHNUT
      ? labels.map((_: any, i: number) => defaultColors[i % defaultColors.length])
      : defaultColors[0]);

    const resolvedBorderColor = borderColor || (Array.isArray(resolvedBackgroundColor) ? resolvedBackgroundColor.map(color => color.replace('0.2', '1')) : (typeof resolvedBackgroundColor === 'string' ? resolvedBackgroundColor.replace('0.2', '1') : defaultColors[0]));


    // Construct data for Chart.js
    return {
      labels: labels,
      datasets: [{
        label: title || dataField,
        data: data,
        backgroundColor: resolvedBackgroundColor,
        borderColor: resolvedBorderColor,
        borderWidth: borderWidth || 1,
      }],
      // Add more options specific to Chart.js configuration
    };
  },
};
```