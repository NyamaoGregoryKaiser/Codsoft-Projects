package com.example.webscrapingtools.scraping.service;

import com.example.webscrapingtools.auth.model.User;
import com.example.webscrapingtools.scraping.model.ScrapedDataItem;
import com.example.webscrapingtools.scraping.model.ScraperDefinition;
import com.example.webscrapingtools.scraping.model.ScrapingStatus;
import com.example.webscrapingtools.scraping.model.ScrapingTask;
import com.example.webscrapingtools.scraping.repository.ScrapedDataItemRepository;
import com.example.webscrapingtools.scraping.repository.ScrapingTaskRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScrapingService {

    private final ScraperDefinitionService scraperDefinitionService;
    private final HtmlParserService htmlParserService;
    private final ScrapingTaskRepository scrapingTaskRepository;
    private final ScrapedDataItemRepository scrapedDataItemRepository;

    private ExecutorService scraperExecutor;

    @PostConstruct
    public void init() {
        // Initialize an executor service for parallel scraping tasks
        // Adjust the pool size based on expected load and resource availability
        scraperExecutor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() * 2);
        log.info("ScrapingService initialized with a fixed thread pool of size {}", Runtime.getRuntime().availableProcessors() * 2);
    }

    /**
     * Entry point to trigger a scraping task, either manually or by scheduler.
     * @param scraperDefinitionId The ID of the scraper to run.
     * @param executedBy The user who triggered the task (can be null for scheduled tasks).
     * @return The created ScrapingTask entity.
     */
    @Transactional
    public ScrapingTask triggerScraping(Long scraperDefinitionId, User executedBy) {
        ScraperDefinition scraperDefinition = scraperDefinitionService.getScraperEntityById(scraperDefinitionId);

        ScrapingTask task = ScrapingTask.builder()
                .scraperDefinition(scraperDefinition)
                .status(ScrapingStatus.PENDING)
                .startTime(LocalDateTime.now())
                .executedBy(executedBy)
                .build();
        task = scrapingTaskRepository.save(task);

        log.info("Scraping task {} for scraper '{}' (ID: {}) triggered by {}. Status: PENDING",
                task.getId(), scraperDefinition.getName(), scraperDefinition.getId(),
                executedBy != null ? executedBy.getUsername() : "Scheduler");

        final Long taskId = task.getId();
        final ScraperDefinition finalScraperDefinition = scraperDefinition;

        scraperExecutor.submit(() -> executeScrapingTask(taskId, finalScraperDefinition));
        return task;
    }

    /**
     * Executes the actual HTML fetching and parsing logic. This method runs in a separate thread.
     * @param taskId The ID of the ScrapingTask.
     * @param scraperDefinition The definition of the scraper.
     */
    private void executeScrapingTask(Long taskId, ScraperDefinition scraperDefinition) {
        ScrapingTask task = scrapingTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalStateException("Scraping task not found with ID: " + taskId));

        task.setStatus(ScrapingStatus.RUNNING);
        task.setStartTime(LocalDateTime.now());
        scrapingTaskRepository.save(task);
        log.info("Scraping task {} for scraper '{}' (ID: {}) is now RUNNING.", taskId, scraperDefinition.getName(), scraperDefinition.getId());

        try {
            Document document = htmlParserService.fetchHtmlDocument(scraperDefinition.getTargetUrl());
            List<Map<String, String>> scrapedData = htmlParserService.parseData(
                    document,
                    scraperDefinition.getItemCssSelector(),
                    scraperDefinition.getFieldDefinitionsJson()
            );

            // Store scraped data items
            for (Map<String, String> dataItem : scrapedData) {
                ScrapedDataItem item = ScrapedDataItem.builder()
                        .scrapingTask(task)
                        .scraperDefinition(scraperDefinition)
                        .data(dataItem)
                        .build();
                scrapedDataItemRepository.save(item);
            }

            task.setStatus(ScrapingStatus.COMPLETED);
            log.info("Scraping task {} for scraper '{}' (ID: {}) COMPLETED. Scraped {} items.",
                    taskId, scraperDefinition.getName(), scraperDefinition.getId(), scrapedData.size());

        } catch (IOException | JsonProcessingException e) {
            task.setStatus(ScrapingStatus.FAILED);
            task.setErrorMessage("Error during scraping: " + e.getMessage());
            log.error("Scraping task {} for scraper '{}' (ID: {}) FAILED: {}",
                    taskId, scraperDefinition.getName(), scraperDefinition.getId(), e.getMessage(), e);
        } finally {
            task.setEndTime(LocalDateTime.now());
            scrapingTaskRepository.save(task);
        }
    }

    /**
     * Scheduled task to run active scrapers based on their interval.
     * Runs every minute and checks if any scraper needs to be triggered.
     * Only triggers a scraper if its last successful run was beyond its interval.
     */
    @Scheduled(fixedRateString = "${app.scraping.scheduler.interval-ms:60000}") // Default 1 minute
    @Transactional // Required to ensure `findByScraperDefinitionIdOrderByStartTimeDesc` can load definition
    public void runScheduledScrapers() {
        log.debug("Running scheduled scraper check...");
        List<ScraperDefinition> scheduledScrapers = scraperDefinitionService.getScheduledScrapers();

        for (ScraperDefinition scraper : scheduledScrapers) {
            if (scraper.getScheduleIntervalMinutes() != null && scraper.getScheduleIntervalMinutes() > 0) {
                List<ScrapingTask> latestTasks = scrapingTaskRepository.findByScraperDefinitionIdOrderByStartTimeDesc(
                        scraper.getId(), org.springframework.data.domain.PageRequest.of(0, 1)
                );

                LocalDateTime lastRunTime = null;
                if (!latestTasks.isEmpty()) {
                    ScrapingTask latestTask = latestTasks.get(0);
                    // Consider last successful run or just last run to avoid constant re-attempts on failure
                    if (latestTask.getStatus() == ScrapingStatus.COMPLETED && latestTask.getEndTime() != null) {
                        lastRunTime = latestTask.getEndTime();
                    } else if (latestTask.getStartTime() != null) { // If not completed, consider its start time as a cooldown
                        lastRunTime = latestTask.getStartTime();
                    }
                }

                if (lastRunTime == null || lastRunTime.plusMinutes(scraper.getScheduleIntervalMinutes()).isBefore(LocalDateTime.now())) {
                    log.info("Scheduler triggering scraper '{}' (ID: {}) due to interval.", scraper.getName(), scraper.getId());
                    triggerScraping(scraper.getId(), null); // Null for executedBy indicates scheduler
                } else {
                    log.debug("Scraper '{}' (ID: {}) not due for scheduling yet. Last run: {}",
                            scraper.getName(), scraper.getId(), lastRunTime);
                }
            }
        }
        log.debug("Finished scheduled scraper check.");
    }

    /**
     * Shuts down the executor service cleanly.
     */
    @PreDestroy
    public void shutdownExecutor() {
        if (scraperExecutor != null && !scraperExecutor.isShutdown()) {
            log.info("Shutting down scraper executor service.");
            scraperExecutor.shutdown();
            try {
                if (!scraperExecutor.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS)) {
                    scraperExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                scraperExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}