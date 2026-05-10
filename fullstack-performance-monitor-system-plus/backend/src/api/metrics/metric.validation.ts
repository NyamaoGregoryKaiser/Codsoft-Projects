import { z } from 'zod';

export const MetricTypeEnum = z.enum(['LCP', 'FID', 'CLS', 'API_RESPONSE', 'ERROR', 'CUSTOM']);
export type MetricType = z.infer<typeof MetricTypeEnum>;

export const MetricPeriodEnum = z.enum(['1h', '6h', '12h', '1d', '7d', '30d']);
export type MetricPeriod = z.infer<typeof MetricPeriodEnum>;

export const SingleMetricSchema = z.object({
  type: MetricTypeEnum,
  value: z.number().nonnegative(),
  timestamp: z.string().datetime({ message: 'Timestamp must be a valid ISO 8601 date string' }),
  context: z.record(z.any()).optional(), // Flexible context for additional data (e.g., URL, component name, error message)
});

export const IngestMetricSchema = z.object({
  metrics: z.array(SingleMetricSchema).min(1, 'At least one metric must be provided'),
});

export type IngestMetricPayload = z.infer<typeof SingleMetricSchema>;

export const GetMetricsQuerySchema = z.object({
  period: MetricPeriodEnum.default('1d'),
  metricType: MetricTypeEnum.optional(), // Optional for summary, required for timeline
});