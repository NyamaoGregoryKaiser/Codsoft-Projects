```javascript
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../../../src/utils/errorHandler');
const { alertService } = require('../../../src/services');
const { alertRepository } = require('../../../src/data-access/repositories');

jest.mock('../../../src/data-access/repositories');
jest.mock('uuid');

describe('Alert Service', () => {
  const mockProjectId = 'project-abc';
  const mockUserId = 'user-123';
  const mockAlertId = 'alert-def';
  const mockIncidentId = 'incident-ghi';

  const mockAlertBody = {
    name: 'High Latency',
    metricType: 'http_request',
    aggregationType: 'avg',
    field: 'durationMs',
    operator: '>',
    threshold: 500,
    timeWindowMinutes: 5,
    isEnabled: true,
  };
  const mockAlert = {
    id: mockAlertId,
    project_id: mockProjectId,
    ...mockAlertBody,
  };
  const mockIncident = {
    id: mockIncidentId,
    alert_id: mockAlertId,
    project_id: mockProjectId,
    status: 'triggered',
    triggered_value: { value: 600 },
    triggered_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    uuidv4.mockReturnValueOnce(mockAlertId).mockReturnValueOnce(mockIncidentId);
  });

  describe('createAlert', () => {
    it('should successfully create a new alert', async () => {
      alertRepository.createAlert.mockResolvedValue(mockAlert);

      const result = await alertService.createAlert(mockProjectId, mockAlertBody);

      expect(alertRepository.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        id: mockAlertId,
        project_id: mockProjectId,
        name: mockAlertBody.name,
      }));
      expect(result).toEqual(mockAlert);
    });
  });

  describe('getAlerts', () => {
    it('should return all alerts for a given project', async () => {
      const alerts = [mockAlert, { ...mockAlert, id: 'alert-xyz', name: 'Another Alert' }];
      alertRepository.getAlertsByProjectId.mockResolvedValue(alerts);

      const result = await alertService.getAlerts(mockProjectId, mockUserId); // mockUserId passed for consistency

      expect(alertRepository.getAlertsByProjectId).toHaveBeenCalledWith(mockProjectId);
      expect(result).toEqual(alerts);
    });
  });

  describe('getAlertById', () => {
    it('should return an alert if found and belongs to project', async () => {
      alertRepository.getAlertById.mockResolvedValue(mockAlert);

      const result = await alertService.getAlertById(mockAlertId, mockProjectId, mockUserId);

      expect(alertRepository.getAlertById).toHaveBeenCalledWith(mockAlertId);
      expect(result).toEqual(mockAlert);
    });

    it('should throw ApiError if alert not found', async () => {
      alertRepository.getAlertById.mockResolvedValue(null);

      await expect(alertService.getAlertById(mockAlertId, mockProjectId, mockUserId)).rejects.toThrow(ApiError);
      await expect(alertService.getAlertById(mockAlertId, mockProjectId, mockUserId)).rejects.toHaveProperty('statusCode', httpStatus.NOT_FOUND);
    });

    it('should throw ApiError if alert found but does not belong to project', async () => {
      const otherAlert = { ...mockAlert, project_id: 'other-project' };
      alertRepository.getAlertById.mockResolvedValue(otherAlert);

      await expect(alertService.getAlertById(mockAlertId, mockProjectId, mockUserId)).rejects.toThrow(ApiError);
      await expect(alertService.getAlertById(mockAlertId, mockProjectId, mockUserId)).rejects.toHaveProperty('statusCode', httpStatus.NOT_FOUND);
    });
  });

  describe('updateAlert', () => {
    const updateBody = { isEnabled: false };
    it('should update an alert if found and belongs to project', async () => {
      alertRepository.getAlertById.mockResolvedValue(mockAlert); // Check ownership
      alertRepository.updateAlert.mockResolvedValue({ ...mockAlert, ...updateBody });

      const result = await alertService.updateAlert(mockAlertId, mockProjectId, mockUserId, updateBody);

      expect(alertRepository.getAlertById).toHaveBeenCalledWith(mockAlertId);
      expect(alertRepository.updateAlert).toHaveBeenCalledWith(mockAlertId, updateBody);
      expect(result).toEqual({ ...mockAlert, ...updateBody });
    });

    it('should throw ApiError if alert not found or not owned for update', async () => {
      alertRepository.getAlertById.mockResolvedValue(null);
      await expect(alertService.updateAlert(mockAlertId, mockProjectId, mockUserId, updateBody)).rejects.toThrow(ApiError);
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert if found and belongs to project', async () => {
      alertRepository.getAlertById.mockResolvedValue(mockAlert);
      alertRepository.deleteAlert.mockResolvedValue(true);

      const result = await alertService.deleteAlert(mockAlertId, mockProjectId, mockUserId);

      expect(alertRepository.getAlertById).toHaveBeenCalledWith(mockAlertId);
      expect(alertRepository.deleteAlert).toHaveBeenCalledWith(mockAlertId);
      expect(result).toEqual({ message: 'Alert deleted successfully' });
    });

    it('should throw ApiError if alert not found or not owned for deletion', async () => {
      alertRepository.getAlertById.mockResolvedValue(null);
      await expect(alertService.deleteAlert(mockAlertId, mockProjectId, mockUserId)).rejects.toThrow(ApiError);
    });
  });

  describe('getAlertIncidents', () => {
    const queryParams = { status: 'triggered', limit: '10', offset: '0' };
    const mockIncidents = [mockIncident];

    it('should return alert incidents for a given project', async () => {
      alertRepository.getAlertIncidentsByProjectId.mockResolvedValue(mockIncidents);

      const result = await alertService.getAlertIncidents(mockProjectId, mockUserId, queryParams);

      expect(alertRepository.getAlertIncidentsByProjectId).toHaveBeenCalledWith(
        mockProjectId,
        queryParams.status,
        parseInt(queryParams.limit, 10),
        parseInt(queryParams.offset, 10)
      );
      expect(result).toEqual(mockIncidents);
    });
  });

  describe('updateAlertIncidentStatus', () => {
    it('should update an alert incident status to resolved', async () => {
      alertRepository.getAlertIncidentById.mockResolvedValue(mockIncident);
      alertRepository.updateAlertIncident.mockResolvedValue({ ...mockIncident, status: 'resolved', resolved_at: expect.any(String) });

      const result = await alertService.updateAlertIncidentStatus(mockIncidentId, mockProjectId, mockUserId, 'resolved');

      expect(alertRepository.getAlertIncidentById).toHaveBeenCalledWith(mockIncidentId);
      expect(alertRepository.updateAlertIncident).toHaveBeenCalledWith(mockIncidentId, expect.objectContaining({ status: 'resolved', resolved_at: expect.any(String) }));
      expect(result).toEqual(expect.objectContaining({ status: 'resolved' }));
    });

    it('should update an alert incident status to acknowledged', async () => {
      alertRepository.getAlertIncidentById.mockResolvedValue(mockIncident);
      alertRepository.updateAlertIncident.mockResolvedValue({ ...mockIncident, status: 'acknowledged' });

      const result = await alertService.updateAlertIncidentStatus(mockIncidentId, mockProjectId, mockUserId, 'acknowledged');

      expect(alertRepository.getAlertIncidentById).toHaveBeenCalledWith(mockIncidentId);
      expect(alertRepository.updateAlertIncident).toHaveBeenCalledWith(mockIncidentId, { status: 'acknowledged' });
      expect(result).toEqual(expect.objectContaining({ status: 'acknowledged' }));
    });

    it('should throw ApiError if incident not found or not owned', async () => {
      alertRepository.getAlertIncidentById.mockResolvedValue(null);
      await expect(alertService.updateAlertIncidentStatus(mockIncidentId, mockProjectId, mockUserId, 'resolved')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError if invalid status is provided', async () => {
      alertRepository.getAlertIncidentById.mockResolvedValue(mockIncident);
      await expect(alertService.updateAlertIncidentStatus(mockIncidentId, mockProjectId, mockUserId, 'invalid_status')).rejects.toThrow(ApiError);
      await expect(alertService.updateAlertIncidentStatus(mockIncidentId, mockProjectId, mockUserId, 'invalid_status')).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
    });
  });
});
```