import { AppDataSource } from '../database/data-source';
import { Page } from '../entities/Page';
import { Application } from '../entities/Application';
import { Logger } from '../config/winston';
import { clearCache } from '../middleware/cache';

export class PageService {
  private pageRepository = AppDataSource.getRepository(Page);
  private applicationRepository = AppDataSource.getRepository(Application);

  async createPage(applicationId: string, name: string, pathRegex: string | undefined) {
    const application = await this.applicationRepository.findOneBy({ id: applicationId });
    if (!application) {
      const error = new Error('Application not found') as any;
      error.statusCode = 404;
      throw error;
    }

    const page = this.pageRepository.create({ applicationId, name, pathRegex });
    await this.pageRepository.save(page);
    Logger.info(`Page created: ${page.id} for application ${applicationId}`);
    clearCache(null as any, null as any, () => {}); // Clear cache
    return page;
  }

  async getPagesByApplication(applicationId: string) {
    return this.pageRepository.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getPageById(applicationId: string, pageId: string) {
    const page = await this.pageRepository.findOne({
      where: { id: pageId, applicationId },
    });
    if (!page) {
      const error = new Error('Page not found') as any;
      error.statusCode = 404;
      throw error;
    }
    return page;
  }

  async updatePage(applicationId: string, pageId: string, updates: Partial<Page>) {
    const page = await this.pageRepository.findOneBy({ id: pageId, applicationId });
    if (!page) {
      const error = new Error('Page not found or not authorized') as any;
      error.statusCode = 404;
      throw error;
    }

    Object.assign(page, updates);
    await this.pageRepository.save(page);
    Logger.info(`Page updated: ${page.id}`);
    clearCache(null as any, null as any, () => {}); // Clear cache
    return page;
  }

  async deletePage(applicationId: string, pageId: string) {
    const result = await this.pageRepository.delete({ id: pageId, applicationId });
    if (result.affected === 0) {
      const error = new Error('Page not found or not authorized') as any;
      error.statusCode = 404;
      throw error;
    }
    Logger.info(`Page deleted: ${pageId}`);
    clearCache(null as any, null as any, () => {}); // Clear cache
    return { message: 'Page deleted successfully' };
  }
}