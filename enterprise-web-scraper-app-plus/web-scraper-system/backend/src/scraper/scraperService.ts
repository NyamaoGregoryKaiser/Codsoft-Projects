```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { ScrapingJob, ScrapingResultStatus } from '@prisma/client';
import prisma from '../database/prisma';
import { logger } from '../middleware/logger';
import { Selector } from '../models/prisma';

// Helper to extract data based on CSS selectors
const extractData = async (page: Page, selectors: Selector[]) => {
  const results: { [key: string]: string | string[] | undefined } = {};

  for (const sel of selectors) {
    const { name, selector } = sel;
    const attributeMatch = selector.match(/@(\w+)$/); // e.g., 'a@href' to get href attribute

    if (attributeMatch) {
      const actualSelector = selector.replace(/@\w+$/, '');
      const attributeName = attributeMatch[1];
      const elements = await page.$$(actualSelector);
      results[name] = await Promise.all(
        elements.map(async (el) => {
          const property = await el.getProperty(attributeName);
          return property ? property.jsonValue() : undefined;
        })
      );
      // Filter out undefined and null values
      if (Array.isArray(results[name])) {
        results[name] = (results[name] as (string | undefined)[]).filter(item => item !== undefined && item !== null);
      }
    } else {
      const elements = await page.$$(selector);
      results[name] = await Promise.all(
        elements.map(async (el) => {
          const textContent = await el.evaluate(node => node.textContent);
          return textContent ? textContent.trim() : undefined;
        })
      );
      // Filter out undefined and null values
      if (Array.isArray(results[name])) {
        results[name] = (results[name] as (string | undefined)[]).filter(item => item !== undefined && item !== null);
      }
    }
  }

  return results;
};

class ScraperService {
  private browser: Browser | null = null;

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Launching new Puppeteer browser instance...');
      this.browser = await puppeteer.launch({
        headless: true, // Use 'new' for new headless mode or 'old' for old, true/false also works
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // This might save some RAM in Docker, but might degrade performance
          '--disable-gpu'
        ],
        protocolTimeout: 0, // Disable protocol timeout to prevent errors on slow pages
      });
      logger.info('Puppeteer browser launched.');
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      logger.info('Closing Puppeteer browser instance...');
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed.');
    }
  }

  async scrape(job: ScrapingJob): Promise<void> {
    let page: Page | null = null;
    let resultStatus: ScrapingResultStatus = ScrapingResultStatus.SUCCESS;
    let errorMessage: string | null = null;
    let scrapedData: any = null;

    logger.info(`Starting scrape for job: ${job.name} (ID: ${job.id})`);

    try {
      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Configure page settings
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36');
      page.setDefaultNavigationTimeout(60000); // 60 seconds timeout for navigation

      await page.goto(job.url, { waitUntil: 'domcontentloaded' }); // Wait for DOM to be loaded

      // Wait for network idle or specific selectors to appear if needed
      // await page.waitForNetworkIdle();
      // await page.waitForSelector(job.cssSelectors[0].selector); // Example: wait for the first selector

      scrapedData = await extractData(page, job.cssSelectors as Selector[]);

      logger.info(`Scraping successful for job: ${job.name}. Data: ${JSON.stringify(scrapedData).substring(0, 200)}...`);

    } catch (error: any) {
      logger.error(`Scraping failed for job ${job.name} (ID: ${job.id}):`, error);
      resultStatus = ScrapingResultStatus.FAILED;
      errorMessage = error.message;
    } finally {
      if (page) {
        await page.close();
      }
      // Store the result
      await prisma.scrapingResult.create({
        data: {
          jobId: job.id,
          status: resultStatus,
          error: errorMessage,
          data: scrapedData,
          timestamp: new Date(),
        },
      });

      // Update job's lastRunAt and status
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          status: job.isActive ? ScrapingJobStatus.ACTIVE : ScrapingJobStatus.INACTIVE, // Reset to active/inactive
        },
      });
      logger.info(`Scraping process for job ${job.name} completed and result stored.`);
    }
  }
}

export default new ScraperService();
```