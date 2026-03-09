```javascript
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Scrapes a single URL using Puppeteer for JavaScript rendered pages.
 * @param {string} url - The URL to scrape.
 * @param {Array<Object>} cssSelectors - Array of objects { name: 'field_name', selector: 'css_selector' }.
 * @param {Object} options - Additional options like proxy, headless mode.
 * @returns {Promise<Object>} An object containing the extracted data.
 * @throws {Error} If scraping fails.
 */
const puppeteerScrape = async (url, cssSelectors, options = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: config.puppeteer.executablePath, // e.g., '/usr/bin/google-chrome'
      headless: config.puppeteer.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000 // 60 seconds
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); // Wait for DOM to load, max 30s

    // Wait for network idle or a specific selector to appear for dynamic content
    // await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }); // Wait for 1 second of network idle after initial load
    // await page.waitForSelector('body', { timeout: 10000 }); // Ensure body is present

    const data = await page.evaluate((selectors) => {
      const extracted = {};
      selectors.forEach(({ name, selector }) => {
        const element = document.querySelector(selector);
        if (element) {
          extracted[name] = element.innerText.trim();
        } else {
          extracted[name] = null; // Or undefined, or an empty string
        }
      });
      return extracted;
    }, cssSelectors);

    logger.info(`Successfully scraped (Puppeteer): ${url}`);
    return data;
  } catch (error) {
    logger.error(`Puppeteer scraping failed for ${url}: ${error.message}`, error);
    throw new Error(`Puppeteer scraping failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Scrapes a single URL using Cheerio for static HTML pages.
 * @param {string} url - The URL to scrape.
 * @param {Array<Object>} cssSelectors - Array of objects { name: 'field_name', selector: 'css_selector' }.
 * @returns {Promise<Object>} An object containing the extracted data.
 * @throws {Error} If scraping fails.
 */
const cheerioScrape = async (url, cssSelectors) => {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 30000, // 30 seconds
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/5037.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/5037.36'
      }
    });
    const $ = cheerio.load(html);

    const extracted = {};
    cssSelectors.forEach(({ name, selector }) => {
      const element = $(selector);
      if (element.length) {
        extracted[name] = element.text().trim();
      } else {
        extracted[name] = null;
      }
    });

    logger.info(`Successfully scraped (Cheerio): ${url}`);
    return extracted;
  } catch (error) {
    logger.error(`Cheerio scraping failed for ${url}: ${error.message}`, error);
    throw new Error(`Cheerio scraping failed: ${error.message}`);
  }
};

/**
 * Orchestrates scraping based on job configuration (JS rendering preference).
 * @param {string} url - The URL to scrape.
 * @param {Array<Object>} cssSelectors - Array of objects { name: 'field_name', selector: 'css_selector' }.
 * @param {boolean} jsRendering - True to use Puppeteer, false for Cheerio.
 * @returns {Promise<Object>} Extracted data.
 */
const scrapePage = async (url, cssSelectors, jsRendering = true) => {
  if (jsRendering) {
    return puppeteerScrape(url, cssSelectors);
  } else {
    return cheerioScrape(url, cssSelectors);
  }
};

module.exports = {
  puppeteerScrape,
  cheerioScrape,
  scrapePage,
};
```