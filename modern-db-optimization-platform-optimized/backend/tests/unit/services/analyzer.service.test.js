const AnalyzerService = require('../../../src/services/analyzer.service');
const Recommendation = require('../../../src/models/recommendation.model');

jest.mock('../../../src/models/recommendation.model');

describe('AnalyzerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('analyzeMetricsAndGenerateRecommendations', () => {
        const mockDbConnectionId = 1;

        it('should generate a slow query recommendation', async () => {
            const currentMetrics = {
                slowQueries: [
                    { pid: 123, usename: 'user1', query: 'SELECT * FROM large_table WHERE id = 1;', duration: '00:00:05' }
                ],
                indexUsage: [],
                connections: [],
                tableSizes: []
            };
            Recommendation.findByConnectionId.mockResolvedValue([]); // No existing recommendations

            const recommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(mockDbConnectionId, currentMetrics);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('slow_query');
            expect(recommendations[0].severity).toBe('critical');
            expect(Recommendation.createMany).toHaveBeenCalledTimes(1);
            expect(Recommendation.createMany).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    db_connection_id: mockDbConnectionId,
                    type: 'slow_query',
                    title: expect.stringContaining('Slow Query Detected'),
                })
            ]));
        });

        it('should generate an unused index recommendation', async () => {
            const currentMetrics = {
                slowQueries: [],
                indexUsage: [
                    { schemaname: 'public', relname: 'users', indexrelname: 'idx_users_email', idx_scan: 5, index_size_bytes: 10000 }
                ],
                connections: [],
                tableSizes: []
            };
            Recommendation.findByConnectionId.mockResolvedValue([]);

            const recommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(mockDbConnectionId, currentMetrics);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('index_unused');
            expect(recommendations[0].severity).toBe('low');
            expect(Recommendation.createMany).toHaveBeenCalledTimes(1);
        });

        it('should generate a high idle connections recommendation', async () => {
            const currentMetrics = {
                slowQueries: [],
                indexUsage: [],
                connections: [{ state: 'idle', count: 60 }, { state: 'active', count: 5 }],
                tableSizes: []
            };
            Recommendation.findByConnectionId.mockResolvedValue([]);

            const recommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(mockDbConnectionId, currentMetrics);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('high_idle_connections');
            expect(recommendations[0].severity).toBe('medium');
            expect(Recommendation.createMany).toHaveBeenCalledTimes(1);
        });

        it('should generate a large table review recommendation', async () => {
            const currentMetrics = {
                slowQueries: [],
                indexUsage: [],
                connections: [],
                tableSizes: [
                    { table_name: 'big_data_table', size: '200MB', size_bytes: 200 * 1024 * 1024, row_count: 1000000 }
                ]
            };
            Recommendation.findByConnectionId.mockResolvedValue([]);

            const recommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(mockDbConnectionId, currentMetrics);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('large_table_review');
            expect(recommendations[0].severity).toBe('low');
            expect(Recommendation.createMany).toHaveBeenCalledTimes(1);
        });

        it('should not generate duplicate recommendations if existing pending ones match', async () => {
            const currentMetrics = {
                slowQueries: [
                    { pid: 123, usename: 'user1', query: 'SELECT * FROM duplicate_query;', duration: '00:00:05' }
                ],
                indexUsage: [],
                connections: [],
                tableSizes: []
            };
            // Mock an existing pending recommendation that is identical
            Recommendation.findByConnectionId.mockResolvedValue([
                {
                    db_connection_id: mockDbConnectionId,
                    type: 'slow_query',
                    title: 'Slow Query Detected: SELECT * FROM duplicate_query...',
                    description: 'A query has been running for an unusually long time (00:00:05). This indicates a potential bottleneck.',
                    sql_suggestion: expect.any(String),
                    severity: 'critical',
                    status: 'pending',
                    details: {
                        pid: 123,
                        usename: 'user1',
                        query_start: expect.any(Date), // Mocked for simplicity
                        duration: '00:00:05',
                        full_query: 'SELECT * FROM duplicate_query;',
                    },
                    generated_at: new Date(),
                }
            ]);

            const recommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(mockDbConnectionId, currentMetrics);

            expect(recommendations).toHaveLength(0); // No new unique recommendations
            expect(Recommendation.createMany).not.toHaveBeenCalled(); // No new recommendations should be stored
        });

        it('should return an empty array if no issues are found', async () => {
            const currentMetrics = {
                slowQueries: [],
                indexUsage: [{ schemaname: 'public', relname: 'users', indexrelname: 'idx_users_email', idx_scan: 1000, index_size_bytes: 10000 }],
                connections: [{ state: 'idle', count: 10 }],
                tableSizes: [{ table_name: 'small_table', size: '10MB', size_bytes: 10 * 1024 * 1024, row_count: 10000 }]
            };
            Recommendation.findByConnectionId.mockResolvedValue([]);

            const recommendations = await AnalyzerService.analyzeMetricsAndGenerateRecommendations(mockDbConnectionId, currentMetrics);

            expect(recommendations).toHaveLength(0);
            expect(Recommendation.createMany).not.toHaveBeenCalled();
        });
    });
});