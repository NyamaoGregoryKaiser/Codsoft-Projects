```javascript
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../../../src/utils/errorHandler');
const { metricService } = require('../../../src/services');
const { metricRepository } = require('../../../src/data-access/repositories');

jest.mock('../../../src/data-access/repositories');
jest.mock('uuid');

describe('Metric Service', () => {
  const mockProjectId = 'project-abc';
  const mockMetricBody = {
    metricType: 'http_request',
    timestamp: new Date().toISOString(),
    data: {
      url: '/test',
      method: 'GET',
      durationMs: 150,
      status: 200,
    },
  };
  const mockIngestedMetric = {
    id: 'metric-123',
    project_id: mockProjectId,
    ...mockMetricBody,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    uuidv4.mockReturnValue('metric-123');
  });

  describe('ingestMetric', () => {
    it('should successfully ingest a new metric', async () => {
      metricRepository.ingestMetric.mockResolvedValue(mockIngestedMetric);

      const result = await metricService.ingestMetric(mockProjectId, mockMetricBody);

      expect(metricRepository.ingestMetric).toHaveBeenCalledWith(expect.objectContaining({
        id: 'metric-123',
        project_id: mockProjectId,
        metric_type: mockMetricBody.metricType,
        timestamp: new Date(mockMetricBody.timestamp).toISOString(),
        data: mockMetricBody.data,
      }));
      expect(result).toEqual(mockIngestedMetric);
    });

    it('should throw ApiError if metricType is missing', async () => {
      const invalidBody = { ...mockMetricBody, metricType: undefined };
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toThrow(ApiError);
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toHaveProperty('message', 'Missing required metric fields: metricType, timestamp, data');
    });

    it('should throw ApiError if timestamp is missing', async () => {
      const invalidBody = { ...mockMetricBody, timestamp: undefined };
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toThrow(ApiError);
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
    });

    it('should throw ApiError if data is missing', async () => {
      const invalidBody = { ...mockMetricBody, data: undefined };
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toThrow(ApiError);
      await expect(metricService.ingestMetric(mockProjectId, invalidBody)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
    });
  });

  describe('getMetricsByProjectId', () => {
    const queryParams = {
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-01T23:59:59Z',
      metricType: 'http_request',
      limit: '10',
      offset: '0',
    };
    const mockMetrics = [mockIngestedMetric];

    it('should return metrics for a given project and query parameters', async () => {
      metricRepository.getMetrics.mockResolvedValue(mockMetrics);

      const result = await metricService.getMetricsByProjectId(mockProjectId, queryParams);

      expect(metricRepository.getMetrics).toHaveBeenCalledWith(
        mockProjectId,
        queryParams.metricType,
        queryParams.startTime,
        queryParams.endTime,
        parseInt(queryParams.limit, 10),
        parseInt(queryParams.offset, 10)
      );
      expect(result).toEqual(mockMetrics);
    });

    it('should use default limit and offset if not provided', async () => {
      const { limit, offset, ...sparseQueryParams } = queryParams;
      metricRepository.getMetrics.mockResolvedValue(mockMetrics);

      await metricService.getMetricsByProjectId(mockProjectId, sparseQueryParams);

      expect(metricRepository.getMetrics).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        100, // Default limit
        0    // Default offset
      );
    });

    it('should throw ApiError if startTime is missing', async () => {
      const invalidQueryParams = { ...queryParams, startTime: undefined };
      await expect(metricService.getMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toThrow(ApiError);
      await expect(metricService.getMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(metricService.getMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('message', 'startTime and endTime are required query parameters');
    });

    it('should throw ApiError if endTime is missing', async () => {
      const invalidQueryParams = { ...queryParams, endTime: undefined };
      await expect(metricService.getMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toThrow(ApiError);
      await expect(metricService.getMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
    });
  });

  describe('getAggregatedMetricsByProjectId', () => {
    const queryParams = {
      metricType: 'http_request',
      field: 'durationMs',
      aggregationType: 'avg',
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-01T23:59:59Z',
      interval: 'hour',
    };
    const mockAggregatedMetrics = [{ interval_start: '2023-01-01T00:00:00Z', value: 120.5 }];

    it('should return aggregated metrics for a given project and query parameters', async () => {
      metricRepository.getAggregatedMetrics.mockResolvedValue(mockAggregatedMetrics);

      const result = await metricService.getAggregatedMetricsByProjectId(mockProjectId, queryParams);

      expect(metricRepository.getAggregatedMetrics).toHaveBeenCalledWith(
        mockProjectId,
        queryParams.metricType,
        `data->>'${queryParams.field}'`,
        queryParams.aggregationType,
        queryParams.startTime,
        queryParams.endTime,
        queryParams.interval
      );
      expect(result).toEqual(mockAggregatedMetrics);
    });

    it('should throw ApiError if metricType is missing', async () => {
      const invalidQueryParams = { ...queryParams, metricType: undefined };
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toThrow(ApiError);
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('message', expect.stringContaining('Missing required aggregation query parameters'));
    });

    it('should throw ApiError if aggregationType is invalid', async () => {
      const invalidQueryParams = { ...queryParams, aggregationType: 'invalid' };
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toThrow(ApiError);
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('message', expect.stringContaining('Invalid aggregationType'));
    });

    it('should throw ApiError if interval is invalid', async () => {
      const invalidQueryParams = { ...queryParams, interval: 'invalid_interval' };
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toThrow(ApiError);
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(metricService.getAggregatedMetricsByProjectId(mockProjectId, invalidQueryParams)).rejects.toHaveProperty('message', expect.stringContaining('Invalid interval'));
    });
  });
});
```