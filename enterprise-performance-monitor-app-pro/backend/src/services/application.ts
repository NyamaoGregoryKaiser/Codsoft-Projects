import { AppDataSource } from '../database/data-source';
import { Application } from '../entities/Application';
import { generateApiKey } from '../utils/password'; // Using this for simplicity, normally it would be a separate utility.
import { Logger } from '../config/winston';
import { clearCache } from '../middleware/cache'; // Import clearCache

export class ApplicationService {
  private applicationRepository = AppDataSource.getRepository(Application);

  async createApplication(name: string, description: string | undefined, ownerId: string) {
    const newApiKey = generateApiKey(); // Generate a raw API key
    // In a production scenario, you would hash this API key before storing it
    // and provide the raw key only ONCE to the user.
    // For this example, we store it directly for simplicity, but it's not ideal.
    const application = this.applicationRepository.create({
      name,
      description,
      ownerId,
      apiKey: newApiKey, // Storing raw key for demo. Hash in production!
    });
    await this.applicationRepository.save(application);
    Logger.info(`Application created: ${application.id} by user ${ownerId}`);
    return application; // Return the app with its API key (only on creation)
  }

  async getApplicationsByOwner(ownerId: string) {
    return this.applicationRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getApplicationById(id: string, ownerId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id, ownerId },
    });
    if (!application) {
      const error = new Error('Application not found') as any;
      error.statusCode = 404;
      throw error;
    }
    return application;
  }

  async updateApplication(id: string, ownerId: string, updates: Partial<Application>) {
    const application = await this.applicationRepository.findOneBy({ id, ownerId });
    if (!application) {
      const error = new Error('Application not found or not authorized') as any;
      error.statusCode = 404;
      throw error;
    }

    Object.assign(application, updates);
    await this.applicationRepository.save(application);
    Logger.info(`Application updated: ${application.id}`);
    // Clear relevant cache entries if reports depend on application details
    clearCache(null as any, null as any, () => {}); // A hacky way to call the middleware without full Express context
    return application;
  }

  async deleteApplication(id: string, ownerId: string) {
    const result = await this.applicationRepository.delete({ id, ownerId });
    if (result.affected === 0) {
      const error = new Error('Application not found or not authorized') as any;
      error.statusCode = 404;
      throw error;
    }
    Logger.info(`Application deleted: ${id}`);
    clearCache(null as any, null as any, () => {}); // Clear cache
    return { message: 'Application deleted successfully' };
  }

  async refreshApiKey(id: string, ownerId: string) {
    const application = await this.applicationRepository.findOneBy({ id, ownerId });
    if (!application) {
      const error = new Error('Application not found or not authorized') as any;
      error.statusCode = 404;
      throw error;
    }

    const newApiKey = generateApiKey();
    application.apiKey = newApiKey; // Again, store hashed key in production
    await this.applicationRepository.save(application);
    Logger.info(`API Key refreshed for application: ${id}`);
    clearCache(null as any, null as any, () => {}); // Clear cache
    return application; // Return application with new API key
  }
}