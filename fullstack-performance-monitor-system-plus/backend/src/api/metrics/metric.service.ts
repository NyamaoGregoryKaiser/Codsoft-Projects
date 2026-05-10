import { prisma } from '../../database/prisma-client';
import { redis } from '../../database/redis-client';
import { IngestMetricPayload, MetricType, MetricPeriod } from './metric.validation';
import { logger } from '../../utils/logger';

// Caching configuration
const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

export const ingestMetrics = async (projectId: string, metrics: IngestMetricPayload[]) => {
  const data = metrics.map(metric => ({
    projectId,
    timestamp: new Date(metric.timestamp),
    type: metric.type,
    value: metric.value,
    context: metric.context || {},
  }));

  await prisma.metric.createMany({ data });
  logger.debug(`Ingested ${metrics.length} metrics for project ${projectId}`);

  // Invalidate relevant caches (e.g., project summary, timeline for current period)
  await redis.del(`project:${projectId}:summary:1d`);
  await redis.del(`project:${projectId}:timeline:LCP:1d`);
  // ... more cache invalidation as needed
};

const getPeriodStartDate = (period: MetricPeriod): Date => {
  const now = new Date();
  switch (period) {
    case '1h':
      now.setHours(now.getHours() - 1);
      break;
    case '6h':
      now.setHours(now.getHours() - 6);
      break;
    case '12h':
      now.setHours(now.getHours() - 12);
      break;
    case '1d':
      now.setDate(now.getDate() - 1);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    default:
      now.setDate(now.getDate() - 1); // Default to 1 day
  }
  return now;
};

const aggregateMetrics = async (
  projectId: string,
  metricType: MetricType,
  period: MetricPeriod,
  aggregateFunction: 'avg' | 'min' | 'max' | 'count' = 'avg'
) => {
  const startDate = getPeriodStartDate(period);

  const result = await prisma.metric.aggregate({
    _avg: { value: true },
    _min: { value: true },
    _max: { value: true },
    _count: { value: true },
    where: {
      projectId,
      type: metricType,
      timestamp: { gte: startDate },
    },
  });

  return {
    avg: result._avg.value,
    min: result._min.value,
    max: result._max.value,
    count: result._count.value,
  };
};

export const getProjectSummaryMetrics = async (projectId: string, period: MetricPeriod = '1d') => {
  const cacheKey = `project:${projectId}:summary:${period}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    logger.debug(`Cache hit for ${cacheKey}`);
    return JSON.parse(cachedData);
  }

  logger.debug(`Cache miss for ${cacheKey}, fetching from DB`);

  const coreWebVitals: MetricType[] = ['LCP', 'FID', 'CLS'];
  const summary: { [key: string]: any } = {};

  for (const type of coreWebVitals) {
    summary[type] = await aggregateMetrics(projectId, type, period);
  }

  // Example: Total errors
  const startDate = getPeriodStartDate(period);
  summary.totalErrors = await prisma.metric.count({
    where: {
      projectId,
      type: 'ERROR',
      timestamp: { gte: startDate },
    },
  });

  await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(summary));
  return summary;
};

export const getMetricsTimeline = async (projectId: string, metricType: MetricType, period: MetricPeriod = '1d') => {
  const cacheKey = `project:${projectId}:timeline:${metricType}:${period}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    logger.debug(`Cache hit for ${cacheKey}`);
    return JSON.parse(cachedData);
  }

  logger.debug(`Cache miss for ${cacheKey}, fetching from DB`);

  const startDate = getPeriodStartDate(period);
  const interval = period === '1h' ? 'minute' : 'hour'; // For 1h, group by minute; otherwise, group by hour

  // This is a simplified aggregation. For true time-series, a dedicated DB or more complex SQL is needed.
  // Here, we fetch all relevant data and group/aggregate in memory or rely on basic SQL aggregation.
  const rawMetrics = await prisma.metric.findMany({
    where: {
      projectId,
      type: metricType,
      timestamp: { gte: startDate },
    },
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true, value: true },
  });

  // Basic in-memory aggregation by hour/minute
  const aggregatedData: { timestamp: string; value: number }[] = [];
  const groups: { [key: string]: { sum: number; count: number } } = {};

  rawMetrics.forEach(metric => {
    const date = new Date(metric.timestamp);
    let key;
    if (interval === 'minute') {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else { // 'hour'
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:00`;
    }

    if (!groups[key]) {
      groups[key] = { sum: 0, count: 0 };
    }
    groups[key].sum += metric.value;
    groups[key].count += 1;
  });

  for (const key in groups) {
    if (Object.prototype.hasOwnProperty.call(groups, key)) {
      aggregatedData.push({
        timestamp: new Date(key).toISOString(),
        value: groups[key].count > 0 ? groups[key].sum / groups[key].count : 0,
      });
    }
  }

  aggregatedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(aggregatedData));
  return aggregatedData;
};

export const getRecentErrors = async (projectId: string, limit: number = 10) => {
  // This could also be cached, but errors are often time-sensitive
  const errors = await prisma.metric.findMany({
    where: {
      projectId,
      type: 'ERROR',
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      context: true,
    },
  });
  return errors;
};