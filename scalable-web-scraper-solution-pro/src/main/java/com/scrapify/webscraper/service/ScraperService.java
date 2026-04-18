```java
package com.scrapify.webscraper.service;

import com.scrapify.webscraper.model.JobExecutionLog;
import com.scrapify.webscraper.model.JobStatus;
import com.scrapify.webscraper.model.ScrapedData;
import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.repository.JobExecutionLogRepository;
import com.scrapify.webscraper.repository.ScrapedDataRepository;
import com.scrapify.webscraper.repository.ScrapingJobRepository;
import com.scrapify.webscraper.util.HtmlParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScraperService {

    private final ScrapingJobRepository scrapingJobRepository;
    private final ScrapedDataRepository scrapedDataRepository;
    private final JobExecutionLogRepository jobExecutionLogRepository;
    private final HtmlParser htmlParser;

    @Transactional
    @CacheEvict(value = {"scrapingJobs", "scrapedData", "jobExecutionLogs"}, allEntries = true)
    public void executeScrapingJob(UUID jobId) {
        ScrapingJob job = scrapingJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Scraping Job not found with id: " + jobId));

        JobExecutionLog logEntry = JobExecutionLog.builder()
                .scrapingJob(job)
                .status(JobStatus.RUNNING)
                .startTime(LocalDateTime.now())
                .build();
        logEntry = jobExecutionLogRepository.save(logEntry);

        job.setStatus(JobStatus.RUNNING);
        job.setLastRunAt(LocalDateTime.now());
        scrapingJobRepository.save(job);
        log.info("Starting scraping job: {} (ID: {})", job.getName(), job.getId());

        int dataCount = 0;
        try {
            Document document = htmlParser.fetchDocument(job.getTargetUrl());
            List<Map<String, String>> extractedData = new ArrayList<>();

            // This is a basic implementation for single-page scraping.
            // For multi-page or more complex scenarios, this would involve pagination logic,
            // recursive calls, or dedicated page object models.
            // Currently assumes the config map directly maps a field name to a CSS selector for a single element.
            Map<String, String> data = htmlParser.extractData(document, job.getConfig());
            if (!data.isEmpty()) {
                extractedData.add(data);
            }

            for (Map<String, String> item : extractedData) {
                ScrapedData scrapedData = ScrapedData.builder()
                        .scrapingJob(job)
                        .data(item)
                        .scrapedUrl(job.getTargetUrl()) // Can be updated if multiple pages were scraped
                        .build();
                scrapedDataRepository.save(scrapedData);
                dataCount++;
            }

            job.setStatus(JobStatus.COMPLETED);
            logEntry.setStatus(JobStatus.COMPLETED);
            logEntry.setDataCount(dataCount);
            log.info("Scraping job {} (ID: {}) completed successfully. Extracted {} items.", job.getName(), job.getId(), dataCount);

        } catch (Exception e) {
            job.setStatus(JobStatus.FAILED);
            logEntry.setStatus(JobStatus.FAILED);
            logEntry.setErrorMessage(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 2000)) : "Unknown error");
            log.error("Scraping job {} (ID: {}) failed: {}", job.getName(), job.getId(), e.getMessage(), e);
        } finally {
            job.setUpdatedAt(LocalDateTime.now());
            scrapingJobRepository.save(job);
            logEntry.setEndTime(LocalDateTime.now());
            jobExecutionLogRepository.save(logEntry);
        }
    }

    /**
     * Optional: Implement Selenium-based scraping for JavaScript-rendered content.
     * This method is illustrative and would require significant setup (WebDriver, browser binaries).
     */
    // @Transactional
    // public void executeSeleniumScrapingJob(UUID jobId) {
    //     ScrapingJob job = scrapingJobRepository.findById(jobId)
    //             .orElseThrow(() -> new RuntimeException("Scraping Job not found with id: " + jobId));
    //
    //     // ... (setup WebDriver, navigate, wait for elements)
    //     // WebDriver driver = new ChromeDriver(chromeOptions);
    //     // driver.get(job.getTargetUrl());
    //     // WebElement element = driver.findElement(By.cssSelector("h1"));
    //     // String title = element.getText();
    //     // ...
    //     // driver.quit();
    // }
}
```