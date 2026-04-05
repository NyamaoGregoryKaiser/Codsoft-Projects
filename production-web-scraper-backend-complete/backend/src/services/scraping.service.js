const puppeteer = require('puppeteer');
const { puppeteer: puppeteerConfig } = require('../config');
const logger = require('../utils/logger');

/**
 * Scrape data from a URL using Puppeteer
 * @param {string} url - The URL to scrape
 * @param {Object} selectors - An object where keys are data fields and values are CSS selectors
 * @returns {Promise<Object>} - Scraped data
 */
const scrapeUrl = async (url, selectors) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: puppeteerConfig.headless,
      args: puppeteerConfig.args,
    });
    const page = await browser.newPage();

    // Set a default timeout
    page.setDefaultTimeout(60000); // 60 seconds

    // Optional: Intercept requests to block unnecessary resources (images, fonts, etc.)
    // await page.setRequestInterception(true);
    // page.on('request', (request) => {
    //   if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
    //     request.abort();
    //   } else {
    //     request.continue();
    //   }
    // });

    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Use 'networkidle0' for full page load

    const scrapedData = await page.evaluate((s) => {
      const data = {};
      for (const key in s) {
        const element = document.querySelector(s[key]);
        if (element) {
          data[key] = element.textContent.trim();
        } else {
          data[key] = null;
        }
      }
      return data;
    }, selectors);

    logger.info(`Successfully scraped URL: ${url}`);
    return scrapedData;
  } catch (error) {
    logger.error(`Error scraping URL ${url}:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  scrapeUrl,
};