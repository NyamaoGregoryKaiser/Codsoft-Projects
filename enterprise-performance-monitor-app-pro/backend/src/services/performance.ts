import { AppDataSource } from '../database/data-source';
import { PerformanceMetric } from '../entities/PerformanceMetric';
import { Page } from '../entities/Page';
import { Logger } from '../config/winston';
import { v4 as uuidv4 } from 'uuid'; // For userSessionId if not provided

interface MetricData {
  metricType: string;
  value: number;
  timestamp?: string;
  pageName?: string; // If page is to be created dynamically
  url?: string;
  userSessionId?: string;
  browser?: string;
  os?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  country?: string;
}

export class PerformanceService {
  private performanceMetricRepository = AppDataSource.getRepository(PerformanceMetric);
  private pageRepository = AppDataSource.getRepository(Page);

  async ingestMetrics(applicationId: string, metrics: MetricData[]) {
    const pagesMap = new Map<string, Page>(); // Cache pages to avoid multiple DB lookups

    const metricsToSave = await Promise.all(
      metrics.map(async (metric) => {
        let page: Page | undefined;
        let pageId: string | undefined;

        if (metric.pageName) {
          // Check if page already exists in cache or DB
          if (pagesMap.has(metric.pageName)) {
            page = pagesMap.get(metric.pageName);
          } else {
            page = await this.pageRepository.findOne({
              where: { applicationId, name: metric.pageName },
            });
            if (page) {
              pagesMap.set(metric.pageName, page);
            }
          }

          // If page not found, create it dynamically
          if (!page) {
            page = this.pageRepository.create({
              applicationId,
              name: metric.pageName,
              pathRegex: metric.url, // Use URL as pathRegex if available
            });
            await this.pageRepository.save(page);
            pagesMap.set(metric.pageName, page);
            Logger.debug(`Dynamically created page: ${page.name} for application ${applicationId}`);
          }
          pageId = page.id;
        }

        return this.performanceMetricRepository.create({
          applicationId,
          pageId: pageId,
          metricType: metric.metricType,
          value: metric.value,
          timestamp: metric.timestamp ? new Date(metric.timestamp) : new Date(),
          userSessionId: metric.userSessionId || uuidv4(), // Generate if not provided
          browser: metric.browser,
          os: metric.os,
          deviceType: metric.deviceType,
          country: metric.country,
          url: metric.url,
        });
      })
    );

    await this.performanceMetricRepository.save(metricsToSave);
    Logger.debug(`Ingested ${metricsToSave.length} metrics for application ${applicationId}`);
    return { count: metricsToSave.length };
  }
}