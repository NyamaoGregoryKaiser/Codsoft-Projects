```javascript
// backend/tests/unit/scraper.service.test.js
const scraperService = require('../../src/services/scraper.service');
const puppeteer = require('puppeteer'); // Mock this
const cheerio = require('cheerio'); // Mock this

// Mock Puppeteer and Cheerio
jest.mock('puppeteer', () => ({
  launch: jest.fn(() => ({
    newPage: jest.fn(() => ({
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      content: jest.fn(() => '<html><body><h1 class="title">Test Title</h1><span class="author">Test Author</span><p class="content">Some test content.</p></body></html>'),
      close: jest.fn(),
    })),
    close: jest.fn(),
  })),
}));

jest.mock('cheerio', () => ({
  load: jest.fn(() => ({
    // Mock for when selectorConfig.items is not present (single item scrape)
    '.title': { text: () => 'Test Title' },
    '.author': { text: () => 'Test Author' },
    '.content': { text: () => 'Some test content.' },
    // Mock for when selectorConfig.items is present (list scrape)
    '.item': jest.fn(() => [
      // Mock for first item
      {
        find: jest.fn((selector) => {
          if (selector === '.item-title') return { text: () => 'Item 1 Title' };
          if (selector === '.item-price') return { text: () => '$10' };
          return { text: () => '' };
        }),
      },
      // Mock for second item
      {
        find: jest.fn((selector) => {
          if (selector === '.item-title') return { text: () => 'Item 2 Title' };
          if (selector === '.item-price') return { text: () => '$20' };
          return { text: () => '' };
        }),
      },
    ]),
  })),
}));

describe('ScraperService Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    puppeteer.launch.mockClear();
    cheerio.load.mockClear();
  });

  it('should scrape a single item successfully using static content', async () => {
    const website = { url: 'http://static.example.com' };
    const selectorConfig = {
      fields: {
        title: '.title',
        author: '.author',
        description: '.content',
      },
    };

    const scrapedData = await scraperService.scrapeWebsite(website, selectorConfig);

    expect(scrapedData).toEqual({
      title: 'Test Title',
      author: 'Test Author',
      description: 'Some test content.',
    });
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    expect(cheerio.load).toHaveBeenCalledTimes(1);
  });

  it('should scrape a list of items successfully using static content', async () => {
    const website = { url: 'http://static.example.com/list' };
    const selectorConfig = {
      items: '.item',
      fields: {
        title: '.item-title',
        price: '.item-price',
      },
    };

    const scrapedData = await scraperService.scrapeWebsite(website, selectorConfig);

    expect(scrapedData).toEqual([
      { title: 'Item 1 Title', price: '$10' },
      { title: 'Item 2 Title', price: '$20' },
    ]);
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    expect(cheerio.load).toHaveBeenCalledTimes(1);
    expect(cheerio.load().item).toHaveBeenCalledWith(selectorConfig.items);
  });

  it('should handle missing selectors gracefully', async () => {
    const website = { url: 'http://static.example.com/partial' };
    const selectorConfig = {
      fields: {
        title: '.title',
        missingField: '.non-existent',
      },
    };
    // Adjust mock behavior for cheerio.load() to return empty for missingField
    cheerio.load.mockImplementationOnce(() => ({
      '.title': { text: () => 'Valid Title' },
      '.non-existent': { text: () => '' }, // Mock returning empty for missing
    }));

    const scrapedData = await scraperService.scrapeWebsite(website, selectorConfig);

    expect(scrapedData).toEqual({
      title: 'Valid Title',
      missingField: '', // Expect empty string for missing
    });
  });

  it('should throw an error if page navigation fails', async () => {
    const website = { url: 'http://bad.example.com' };
    const selectorConfig = { fields: { title: '.title' } };

    // Mock puppeteer's goto to throw an error
    puppeteer.launch.mockImplementationOnce(() => ({
      newPage: jest.fn(() => ({
        goto: jest.fn(() => { throw new Error('Page not found'); }),
        close: jest.fn(),
      })),
      close: jest.fn(),
    }));

    await expect(scraperService.scrapeWebsite(website, selectorConfig)).rejects.toThrow('Page not found');
  });

  // Test cases for attribute scraping, dynamic content, etc. would follow
});
```