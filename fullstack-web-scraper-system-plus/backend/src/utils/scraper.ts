import puppeteer from 'puppeteer';
import { ScrapedData } from '../entities/ScrapedData';
import { ScrapeLog } from '../entities/ScrapeLog';
import { ScrapeJob } from '../entities/ScrapeJob';
import { ScrapedDataRepository } from '../repositories/ScrapedDataRepository';
import { ScrapeLogRepository } from '../repositories/ScrapeLogRepository';
import { logger } from './logger';
import { PUPPETEER_HEADLESS, PUPPETEER_EXECUTABLE_PATH } from '../config';
import { AppError } from './appError';
import { LogLevel, ScrapeJobStatus } from '../types/enums';

// Helper to sanitize and validate URL (basic check, more robust validation in production)
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export async function executeScrapeJob(job: ScrapeJob): Promise<ScrapedData | undefined> {
  const browser = await puppeteer.launch({
    headless: PUPPETEER_HEADLESS as puppeteer.PuppeteerNodeLaunchOptions['headless'],
    executablePath: PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // This might save some resources, but can be problematic on some OS
      '--disable-gpu',
    ],
  });
  let page: puppeteer.Page | undefined;

  try {
    if (!isValidUrl(job.url)) {
      throw new AppError(`Invalid URL provided: ${job.url}`, 400);
    }

    logger.info(`Starting scrape job for URL: ${job.url} with selector: ${job.cssSelector} (Job ID: ${job.id})`);
    await ScrapeLogRepository.save(ScrapeLogRepository.create({
      scrapeJob: job,
      jobId: job.id,
      level: LogLevel.INFO,
      message: `Scraping started for URL: ${job.url}`,
    }));

    page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000); // 60 seconds timeout

    // Intercept requests to block unnecessary resources (images, fonts, stylesheets)
    // This can speed up scraping and save bandwidth
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    const response = await page.goto(job.url, { waitUntil: 'domcontentloaded' });

    if (response?.status() && response.status() >= 400) {
      throw new AppError(`Failed to load URL: ${job.url}. Status: ${response.status()}`, response.status());
    }

    const data = await page.evaluate((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map(el => el.textContent?.trim() || '').filter(text => text.length > 0);
    }, job.cssSelector);

    logger.info(`Scraped ${data.length} items from ${job.url} (Job ID: ${job.id})`);

    const scrapedData = ScrapedDataRepository.create({
      scrapeJob: job,
      jobId: job.id,
      data: { extractedItems: data },
      urlUsed: job.url,
      success: true,
    });
    await ScrapedDataRepository.save(scrapedData);

    await ScrapeLogRepository.save(ScrapeLogRepository.create({
      scrapeJob: job,
      jobId: job.id,
      level: LogLevel.INFO,
      message: `Scraping completed successfully. Found ${data.length} items.`,
    }));

    return scrapedData;

  } catch (error: any) {
    const errorMessage = error instanceof AppError ? error.message : `Unknown scraping error: ${error.message}`;
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    logger.error(`Scrape job failed for URL: ${job.url} (Job ID: ${job.id}): ${errorMessage}`, error);

    await ScrapeLogRepository.save(ScrapeLogRepository.create({
      scrapeJob: job,
      jobId: job.id,
      level: LogLevel.ERROR,
      message: `Scraping failed: ${errorMessage}`,
    }));

    const failedScrapeData = ScrapedDataRepository.create({
      scrapeJob: job,
      jobId: job.id,
      data: { error: errorMessage, statusCode: statusCode },
      urlUsed: job.url,
      success: false,
      errorMessage: errorMessage,
    });
    await ScrapedDataRepository.save(failedScrapeData);

    // If a job consistently fails, consider pausing it automatically after N failures.
    // This logic would live in the ScrapeJobService or Scheduler.
    return undefined;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}