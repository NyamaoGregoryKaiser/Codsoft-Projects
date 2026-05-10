// This is a simplified "performance test" - more accurately a load test example.
// For true performance testing, dedicated tools (JMeter, k6, Artillery) integrated with CI are used.

import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/database/prisma-client';
import dotenv from 'dotenv';
import { IngestMetricPayload, MetricType } from '../../src/api/metrics/metric.validation'; // Correct import

dotenv.config({ path: '.env.test' });
const API_KEY_HEADER = process.env.API_KEY_HEADER || 'x-appinsight-api-key';

describe('Performance Test: Metric Ingestion', () => {
  let testProject: any;
  const numRequests = 50; // Number of concurrent/sequential requests
  const metricsPerRequest = 10; // Number of metrics in each payload

  beforeAll(async () => {
    // Create a project for ingesting metrics
    testProject = await prisma.project.create({
      data: { name: 'Perf Test Project', ownerId: 'cluf7g1z00000j2a0s8l4l6y8', apikey: 'perf-test-api-key' }, // Use a dummy ownerId or create a real user
    });
  });

  it(`should handle ${numRequests} requests each with ${metricsPerRequest} metrics efficiently`, async () => {
    const generateMetrics = (count: number): IngestMetricPayload[] => {
      const metrics: IngestMetricPayload[] = [];
      const metricTypes: MetricType[] = ['LCP', 'FID', 'CLS', 'API_RESPONSE', 'ERROR'];
      for (let i = 0; i < count; i++) {
        metrics.push({
          type: metricTypes[Math.floor(Math.random() * metricTypes.length)],
          value: Math.random() * 5000,
          timestamp: new Date().toISOString(),
          context: { requestId: `req-${i}`, component: `comp-${Math.floor(Math.random() * 5)}` },
        });
      }
      return metrics;
    };

    const startTime = process.hrtime();
    const requests = Array.from({ length: numRequests }).map(() =>
      request(app)
        .post('/api/metrics/ingest')
        .set(API_KEY_HEADER, testProject.apikey)
        .send({ metrics: generateMetrics(metricsPerRequest) })
    );

    const responses = await Promise.all(requests);
    const endTime = process.hrtime(startTime);
    const durationMs = (endTime[0] * 1000) + (endTime[1] / 1000000);

    console.log(`\nMetric Ingestion Performance Test:`);
    console.log(`  Total requests: ${numRequests}`);
    console.log(`  Metrics per request: ${metricsPerRequest}`);
    console.log(`  Total metrics ingested: ${numRequests * metricsPerRequest}`);
    console.log(`  Total duration: ${durationMs.toFixed(2)} ms`);
    console.log(`  Average response time: ${(durationMs / numRequests).toFixed(2)} ms`);

    responses.forEach(res => {
      expect(res.statusCode).toBe(202);
      expect(res.body.status).toBe('success');
    });

    const totalMetricsInDb = await prisma.metric.count({ where: { projectId: testProject.id } });
    expect(totalMetricsInDb).toBe(numRequests * metricsPerRequest);

    // Assert that the average response time is within an acceptable threshold (e.g., 500ms)
    // This threshold should be determined by your application's requirements and environment.
    const averageResponseTimeMs = durationMs / numRequests;
    console.log(`  Asserting average response time < 500ms: ${averageResponseTimeMs.toFixed(2)}ms`);
    expect(averageResponseTimeMs).toBeLessThan(500); // Example threshold
  }, 30000); // Increase test timeout for performance tests
});