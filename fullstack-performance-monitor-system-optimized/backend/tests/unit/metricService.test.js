```javascript
const metricService = require('../../services/metricService');
const { Metric, Application, Alert, sequelize } = require('../../models'); // Assume models are set up
const { Op } = require('sequelize');

jest.mock('../../models', () => ({
  Metric: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
  Application: {
    findByPk: jest.fn(),
  },
  Alert: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
  sequelize: {
    authenticate: jest.fn(),
    sync: jest.fn(),
    close: jest.fn(),
  },
  Op: require('sequelize').Op, // Use actual Op from sequelize
}));

describe('Metric Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process.nextTick to execute immediately for alert checks
    jest.spyOn(process, 'nextTick').mockImplementation(fn => fn());
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore process.nextTick
  });

  describe('collectMetric', () => {
    const mockApplicationId = 'app-id-123';
    const mockTimestamp = new Date();

    it('should successfully collect a new metric', async () => {
      const metricData = { type: 'cpu', value: 0.5 };
      const mockNewMetric = {
        id: 'metric-id-456',
        applicationId: mockApplicationId,
        ...metricData,
        timestamp: mockTimestamp,
      };

      Metric.create.mockResolvedValue(mockNewMetric);
      Alert.findAll.mockResolvedValue([]); // No active alerts for simplicity

      const result = await metricService.collectMetric(mockApplicationId, metricData);

      expect(Metric.create).toHaveBeenCalledWith({
        applicationId: mockApplicationId,
        type: metricData.type,
        value: metricData.value,
        timestamp: expect.any(Date), // timestamp can be passed or defaulted
      });
      expect(result).toEqual(mockNewMetric);
    });

    it('should trigger alert check after collecting metric', async () => {
      const metricData = { type: 'cpu', value: 0.95 };
      const mockNewMetric = {
        id: 'metric-id-456',
        applicationId: mockApplicationId,
        ...metricData,
        timestamp: mockTimestamp,
      };
      Metric.create.mockResolvedValue(mockNewMetric);

      const mockAlert = {
        operator: '>',
        thresholdValue: 0.9,
        status: 'active',
        update: jest.fn().mockResolvedValue(true),
      };
      Alert.findAll.mockResolvedValue([mockAlert]);

      await metricService.collectMetric(mockApplicationId, metricData);

      expect(Alert.findAll).toHaveBeenCalledWith({
        where: {
          applicationId: mockApplicationId,
          metricType: metricData.type,
          status: 'active',
        },
      });
      expect(mockAlert.update).toHaveBeenCalledWith({
        status: 'triggered',
        triggeredAt: mockNewMetric.timestamp,
        message: expect.stringContaining(`Alert for cpu when value is > 0.9 - Current value: ${metricData.value}`)
      });
    });

    it('should throw an error if metric type or value are missing', async () => {
      await expect(metricService.collectMetric(mockApplicationId, { type: 'cpu' }))
        .rejects.toThrow('Metric type and value are required.');
      await expect(metricService.collectMetric(mockApplicationId, { value: 0.5 }))
        .rejects.toThrow('Metric type and value are required.');
    });

    it('should throw an error for invalid metric type', async () => {
      await expect(metricService.collectMetric(mockApplicationId, { type: 'invalid_type', value: 0.5 }))
        .rejects.toThrow('Invalid metric type: invalid_type. Valid types are: cpu, memory, request_latency, error_rate');
    });

    it('should throw an error for non-numeric metric value', async () => {
      await expect(metricService.collectMetric(mockApplicationId, { type: 'cpu', value: 'not_a_number' }))
        .rejects.toThrow('Metric value must be a number.');
    });
  });

  describe('getMetricsByApplicationAndType', () => {
    const mockApplicationId = 'app-id-123';
    const mockMetricType = 'cpu';
    const mockMetrics = [
      { value: 0.1, timestamp: new Date(Date.now() - 3600 * 1000) },
      { value: 0.2, timestamp: new Date(Date.now() - 1800 * 1000) },
    ];

    it('should retrieve metrics for a given application and type within 24h by default', async () => {
      Metric.findAll.mockResolvedValue(mockMetrics);

      const result = await metricService.getMetricsByApplicationAndType(mockApplicationId, mockMetricType);

      expect(Metric.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          applicationId: mockApplicationId,
          type: mockMetricType,
          timestamp: { [Op.gte]: expect.any(Date) },
        },
        order: [['timestamp', 'ASC']],
        attributes: ['value', 'timestamp'],
      }));
      expect(result).toEqual(mockMetrics);
    });

    it('should retrieve metrics for a specified period (e.g., 7d) and aggregate them', async () => {
      const now = Date.now();
      const mockLongMetrics = [];
      for (let i = 0; i < 7 * 24; i++) { // Mock hourly data for 7 days
        mockLongMetrics.push({ value: 0.1 + i / 100, timestamp: new Date(now - i * 3600 * 1000) });
      }
      Metric.findAll.mockResolvedValue(mockLongMetrics);

      const result = await metricService.getMetricsByApplicationAndType(mockApplicationId, mockMetricType, '7d');

      expect(Metric.findAll).toHaveBeenCalled(); // Confirm it's called
      expect(result.length).toBeLessThanOrEqual(mockLongMetrics.length); // Should be aggregated
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('timestamp');
    });

    it('should throw an error for invalid metric type', async () => {
      await expect(metricService.getMetricsByApplicationAndType(mockApplicationId, 'invalid_type'))
        .rejects.toThrow('Invalid metric type: invalid_type');
    });

    it('should throw an error for invalid time period', async () => {
      await expect(metricService.getMetricsByApplicationAndType(mockApplicationId, mockMetricType, 'invalid_period'))
        .rejects.toThrow('Invalid time period specified. Use 1h, 24h, 7d, or 30d.');
    });
  });

  describe('getApplicationAlerts', () => {
    const mockApplicationId = 'app-id-123';
    const mockAlerts = [
      { id: 'alert-1', metricType: 'cpu', status: 'active' },
      { id: 'alert-2', metricType: 'memory', status: 'triggered' },
    ];

    it('should retrieve all alerts for a given application', async () => {
      Alert.findAll.mockResolvedValue(mockAlerts);

      const result = await metricService.getApplicationAlerts(mockApplicationId);

      expect(Alert.findAll).toHaveBeenCalledWith({
        where: { applicationId: mockApplicationId },
        order: [['triggeredAt', 'DESC'], ['createdAt', 'DESC']],
      });
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('createAlert', () => {
    const mockApplicationId = 'app-id-123';
    const alertData = {
      metricType: 'cpu',
      thresholdValue: 0.9,
      operator: '>',
      message: 'CPU high alert',
    };
    const mockNewAlert = { id: 'new-alert-id', applicationId: mockApplicationId, ...alertData, status: 'active' };

    it('should successfully create a new alert', async () => {
      Alert.create.mockResolvedValue(mockNewAlert);

      const result = await metricService.createAlert(mockApplicationId, alertData);

      expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({
        applicationId: mockApplicationId,
        ...alertData,
        status: 'active',
      }));
      expect(result).toEqual(mockNewAlert);
    });

    it('should throw an error if required alert fields are missing', async () => {
      await expect(metricService.createAlert(mockApplicationId, { metricType: 'cpu' }))
        .rejects.toThrow('Metric type, threshold value, and operator are required for an alert.');
    });

    it('should throw an error for invalid metric type', async () => {
      await expect(metricService.createAlert(mockApplicationId, { ...alertData, metricType: 'invalid' }))
        .rejects.toThrow('Invalid metric type: invalid.');
    });

    it('should throw an error for invalid operator', async () => {
      await expect(metricService.createAlert(mockApplicationId, { ...alertData, operator: 'invalid' }))
        .rejects.toThrow('Invalid operator: invalid.');
    });
  });

  describe('updateAlert', () => {
    const mockAlertId = 'alert-id-to-update';
    const mockExistingAlert = {
      id: mockAlertId,
      applicationId: 'app-id-123',
      metricType: 'cpu',
      thresholdValue: 0.8,
      operator: '>',
      message: 'Old message',
      status: 'active',
      save: jest.fn().mockResolvedValue(true),
    };

    it('should successfully update an existing alert', async () => {
      Alert.findByPk.mockResolvedValue(mockExistingAlert);
      const updateData = {
        thresholdValue: 0.95,
        status: 'triggered',
        message: 'New message',
      };

      const result = await metricService.updateAlert(mockAlertId, updateData);

      expect(Alert.findByPk).toHaveBeenCalledWith(mockAlertId);
      expect(mockExistingAlert.thresholdValue).toBe(updateData.thresholdValue);
      expect(mockExistingAlert.status).toBe(updateData.status);
      expect(mockExistingAlert.message).toBe(updateData.message);
      expect(mockExistingAlert.save).toHaveBeenCalled();
      expect(result).toEqual(mockExistingAlert); // Returns the updated object
    });

    it('should set resolvedAt when status is changed to "resolved"', async () => {
      const resolvedAlert = { ...mockExistingAlert, status: 'triggered', resolvedAt: null };
      Alert.findByPk.mockResolvedValue(resolvedAlert);

      const updateData = { status: 'resolved' };
      await metricService.updateAlert(mockAlertId, updateData);

      expect(resolvedAlert.resolvedAt).not.toBeNull();
      expect(resolvedAlert.save).toHaveBeenCalled();
    });

    it('should throw an error if alert not found', async () => {
      Alert.findByPk.mockResolvedValue(null);
      await expect(metricService.updateAlert('non-existent-alert', {}))
        .rejects.toThrow('Alert not found.');
    });

    it('should throw an error for invalid metric type in update', async () => {
      Alert.findByPk.mockResolvedValue(mockExistingAlert);
      await expect(metricService.updateAlert(mockAlertId, { metricType: 'invalid' }))
        .rejects.toThrow('Invalid metric type: invalid');
    });

    it('should throw an error for invalid operator in update', async () => {
      Alert.findByPk.mockResolvedValue(mockExistingAlert);
      await expect(metricService.updateAlert(mockAlertId, { operator: 'invalid' }))
        .rejects.toThrow('Invalid operator: invalid');
    });

    it('should throw an error for invalid status in update', async () => {
      Alert.findByPk.mockResolvedValue(mockExistingAlert);
      await expect(metricService.updateAlert(mockAlertId, { status: 'bad_status' }))
        .rejects.toThrow('Invalid status: bad_status');
    });
  });

  describe('deleteAlert', () => {
    const mockAlertId = 'alert-id-to-delete';

    it('should successfully delete an alert', async () => {
      Alert.destroy.mockResolvedValue(1); // 1 row deleted

      const result = await metricService.deleteAlert(mockAlertId);

      expect(Alert.destroy).toHaveBeenCalledWith({ where: { id: mockAlertId } });
      expect(result).toBe(true);
    });

    it('should throw an error if alert not found', async () => {
      Alert.destroy.mockResolvedValue(0); // 0 rows deleted
      await expect(metricService.deleteAlert('non-existent-alert'))
        .rejects.toThrow('Alert not found.');
    });
  });

  describe('aggregateMetrics', () => {
    it('should return empty array if no metrics', () => {
      expect(metricService.aggregateMetrics([], 3600 * 1000)).toEqual([]);
    });

    it('should aggregate metrics into hourly averages', () => {
      const now = new Date('2023-01-01T12:30:00.000Z');
      const metrics = [
        { value: 10, timestamp: new Date(now.getTime() - 2 * 3600 * 1000 - 10 * 60 * 1000) }, // 10:20
        { value: 20, timestamp: new Date(now.getTime() - 2 * 3600 * 1000) }, // 10:30
        { value: 30, timestamp: new Date(now.getTime() - 1 * 3600 * 1000 - 10 * 60 * 1000) }, // 11:20
        { value: 40, timestamp: new Date(now.getTime() - 1 * 3600 * 1000) }, // 11:30
        { value: 50, timestamp: new Date(now.getTime() - 30 * 60 * 1000) }, // 12:00
      ];
      const intervalMs = 3600 * 1000; // 1 hour

      const result = metricService.aggregateMetrics(metrics, intervalMs);

      expect(result).toEqual([
        { value: 15, timestamp: new Date('2023-01-01T10:00:00.000Z') }, // (10+20)/2
        { value: 35, timestamp: new Date('2023-01-01T11:00:00.000Z') }, // (30+40)/2
        { value: 50, timestamp: new Date('2023-01-01T12:00:00.000Z') }, // (50)/1
      ]);
    });
  });
});
```