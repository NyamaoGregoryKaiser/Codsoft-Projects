import { AppDataSource } from '../database/data-source';
import { PerformanceMetric } from '../entities/PerformanceMetric';
import { Logger } from '../config/winston';
import { Raw } from 'typeorm';

export class ReportService {
  private performanceMetricRepository = AppDataSource.getRepository(PerformanceMetric);

  // Get application overview: total metrics, average LCP/FCP, number of pages
  async getApplicationOverview(applicationId: string, periodDays: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const commonQuery = this.performanceMetricRepository
      .createQueryBuilder('metric')
      .where('metric.applicationId = :applicationId', { applicationId })
      .andWhere('metric.timestamp >= :startDate', { startDate });

    const totalMetrics = await commonQuery.getCount();

    const avgLCP = await commonQuery
      .clone()
      .select('AVG(metric.value)', 'avgLCP')
      .andWhere('metric.metricType = :type', { type: 'LCP' })
      .getRawOne();

    const avgFCP = await commonQuery
      .clone()
      .select('AVG(metric.value)', 'avgFCP')
      .andWhere('metric.metricType = :type', { type: 'FCP' })
      .getRawOne();

    const distinctPages = await commonQuery
      .clone()
      .select('COUNT(DISTINCT metric.pageId)', 'pageCount')
      .getRawOne();

    Logger.debug(`Generated overview for application ${applicationId}`);
    return {
      totalMetrics,
      avgLCP: avgLCP?.avgLCP || null,
      avgFCP: avgFCP?.avgFCP || null,
      pageCount: distinctPages?.pageCount || 0,
      periodDays,
    };
  }

  // Get metrics for a specific page: average over time, breakdown by browser/device
  async getPageMetrics(applicationId: string, pageId: string, metricType: string, periodDays: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const metrics = await this.performanceMetricRepository
      .createQueryBuilder('metric')
      .where('metric.applicationId = :applicationId', { applicationId })
      .andWhere('metric.pageId = :pageId', { pageId })
      .andWhere('metric.metricType = :metricType', { metricType })
      .andWhere('metric.timestamp >= :startDate', { startDate })
      .orderBy('metric.timestamp', 'ASC')
      .getMany();

    // Aggregate by browser
    const browserBreakdown = await this.performanceMetricRepository
      .createQueryBuilder('metric')
      .select('metric.browser', 'browser')
      .addSelect('AVG(metric.value)', 'averageValue')
      .where('metric.applicationId = :applicationId', { applicationId })
      .andWhere('metric.pageId = :pageId', { pageId })
      .andWhere('metric.metricType = :metricType', { metricType })
      .andWhere('metric.timestamp >= :startDate', { startDate })
      .groupBy('metric.browser')
      .getRawMany();

    // Aggregate by device type
    const deviceBreakdown = await this.performanceMetricRepository
      .createQueryBuilder('metric')
      .select('metric.deviceType', 'deviceType')
      .addSelect('AVG(metric.value)', 'averageValue')
      .where('metric.applicationId = :applicationId', { applicationId })
      .andWhere('metric.pageId = :pageId', { pageId })
      .andWhere('metric.metricType = :metricType', { metricType })
      .andWhere('metric.timestamp >= :startDate', { startDate })
      .groupBy('metric.deviceType')
      .getRawMany();

    Logger.debug(`Generated page metrics for page ${pageId}, type ${metricType}`);
    return {
      metrics,
      browserBreakdown,
      deviceBreakdown,
    };
  }

  // Get trend data for a specific metric across an application or page
  async getMetricTrends(applicationId: string, metricType: string, pageId?: string, periodDays: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const query = this.performanceMetricRepository
      .createQueryBuilder('metric')
      .select("DATE_TRUNC('day', metric.timestamp)", 'date')
      .addSelect('AVG(metric.value)', 'averageValue')
      .where('metric.applicationId = :applicationId', { applicationId })
      .andWhere('metric.metricType = :metricType', { metricType })
      .andWhere('metric.timestamp >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('day', metric.timestamp)")
      .orderBy('date', 'ASC');

    if (pageId) {
      query.andWhere('metric.pageId = :pageId', { pageId });
    }

    const trends = await query.getRawMany();
    Logger.debug(`Generated metric trends for application ${applicationId}, type ${metricType}, page ${pageId || 'N/A'}`);
    return trends;
  }
}