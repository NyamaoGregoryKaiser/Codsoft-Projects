const queryService = require('@services/queryService');
const prisma = require('@config/db').default;
const { appCache } = require('@utils/cache');

// Mock `appCache` methods if you want to test cache interaction precisely
jest.mock('@utils/cache', () => ({
  __esModule: true,
  getOrSetCache: jest.fn((key, fetcher) => fetcher()), // Always simulate cache miss for simpler tests
  delCache: jest.fn(),
  appCache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn(),
  },
}));

describe('Query Service', () => {
  const mockDbInstanceId = 'instance-123';
  const mockQueries = [
    { id: 'q1', dbInstanceId: mockDbInstanceId, queryText: 'SELECT * FROM users', durationMs: 1200, occurredAt: new Date(), hash: 'h1' },
    { id: 'q2', dbInstanceId: mockDbInstanceId, queryText: 'SELECT * FROM products WHERE price > 100', durationMs: 800, occurredAt: new Date(), hash: 'h2' },
    { id: 'q3', dbInstanceId: mockDbInstanceId, queryText: 'INSERT INTO logs VALUES ()', durationMs: 300, occurredAt: new Date(), hash: 'h3' },
  ];
  const mockQueryExplanations = [
    { id: 'exp1', monitoredQueryId: 'q1', planType: 'Seq Scan', cost: 1000, rows: 100000, actualTime: 1.2, loops: 1, detail: {} },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure getOrSetCache mock is active for each test to simulate specific cache behavior
    require('@utils/cache').getOrSetCache.mockImplementation((key, fetcher) => fetcher());
  });

  describe('getSlowQueries', () => {
    it('should return a paginated list of slow queries', async () => {
      prisma.monitoredQuery.findMany.mockResolvedValue([mockQueries[0], mockQueries[1]]);
      prisma.monitoredQuery.count.mockResolvedValue(3);
      prisma.$transaction.mockResolvedValueOnce([
        [mockQueries[0], mockQueries[1]],
        3
      ]);


      const result = await queryService.getSlowQueries(mockDbInstanceId, {}, 1, 2);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.monitoredQuery.findMany).toHaveBeenCalledWith({
        where: { dbInstanceId: mockDbInstanceId },
        orderBy: { occurredAt: 'desc' },
        skip: 0,
        take: 2,
      });
      expect(prisma.monitoredQuery.count).toHaveBeenCalledWith({
        where: { dbInstanceId: mockDbInstanceId },
      });
      expect(result.queries).toEqual([mockQueries[0], mockQueries[1]]);
      expect(result.totalCount).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        minDuration: '500',
        queryText: 'users',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };
      prisma.$transaction.mockResolvedValueOnce([
        [mockQueries[0]],
        1
      ]);

      await queryService.getSlowQueries(mockDbInstanceId, filters, 1, 10);

      expect(prisma.monitoredQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            dbInstanceId: mockDbInstanceId,
            durationMs: { gte: 500 },
            queryText: { contains: 'users', mode: 'insensitive' },
            occurredAt: { gte: new Date('2023-01-01'), lte: new Date('2023-01-31') },
          },
        })
      );
    });
  });

  describe('getQueryById', () => {
    it('should return a single query with explanations', async () => {
      const mockQueryWithExplanations = {
        ...mockQueries[0],
        queryExplanation: mockQueryExplanations,
      };
      prisma.monitoredQuery.findUnique.mockResolvedValue(mockQueryWithExplanations);

      const result = await queryService.getQueryById('q1');

      expect(prisma.monitoredQuery.findUnique).toHaveBeenCalledWith({
        where: { id: 'q1' },
        include: { queryExplanation: true },
      });
      expect(result).toEqual(mockQueryWithExplanations);
    });

    it('should return null if query not found', async () => {
      prisma.monitoredQuery.findUnique.mockResolvedValue(null);

      const result = await queryService.getQueryById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getQueryExplanations', () => {
    it('should return all explanations for a given query', async () => {
      prisma.queryExplanation.findMany.mockResolvedValue(mockQueryExplanations);

      const result = await queryService.getQueryExplanations('q1');

      expect(prisma.queryExplanation.findMany).toHaveBeenCalledWith({
        where: { monitoredQueryId: 'q1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockQueryExplanations);
    });

    it('should return an empty array if no explanations found', async () => {
      prisma.queryExplanation.findMany.mockResolvedValue([]);

      const result = await queryService.getQueryExplanations('q_no_explanations');
      expect(result).toEqual([]);
    });
  });
});
```

#### `backend/tests/unit/utils/logger.test.js`
```javascript