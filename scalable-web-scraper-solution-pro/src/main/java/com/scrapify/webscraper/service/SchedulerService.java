```java
package com.scrapify.webscraper.service;

import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.repository.ScrapingJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final TaskScheduler taskScheduler;
    private final ScrapingJobRepository scrapingJobRepository;
    private final ScraperService scraperService;

    // Stores scheduled tasks so they can be cancelled/rescheduled
    private final Map<UUID, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    // Initialize scheduler with existing jobs on application startup
    @Scheduled(fixedRate = 60000) // Run every minute to check for new/updated schedules (could be more sophisticated)
    @Transactional // Ensure jobs are loaded within a transaction
    public void initializeScheduledJobs() {
        log.info("Checking for scheduled jobs to initialize/update...");
        List<ScrapingJob> jobsWithSchedule = scrapingJobRepository.findByCronScheduleIsNotNull();
        jobsWithSchedule.forEach(this::scheduleJob);
        // Remove tasks that no longer exist in DB or no longer have a schedule
        scheduledTasks.keySet().retainAll(jobsWithSchedule.stream().map(ScrapingJob::getId).toList());
    }

    public void scheduleJob(ScrapingJob job) {
        if (job.getCronSchedule() == null || job.getCronSchedule().isBlank()) {
            unscheduleJob(job.getId());
            return;
        }

        // If job is already scheduled, cancel the existing one before scheduling a new one
        unscheduleJob(job.getId());

        try {
            CronTrigger cronTrigger = new CronTrigger(job.getCronSchedule());
            ScheduledFuture<?> future = taskScheduler.schedule(() -> {
                log.info("Executing scheduled job: {} (ID: {})", job.getName(), job.getId());
                scraperService.executeScrapingJob(job.getId());
            }, cronTrigger);
            scheduledTasks.put(job.getId(), future);

            // Calculate next run time for display purposes
            Date nextExecutionDate = cronTrigger.nextExecution(triggerContext -> {
                // Get the last completion time if available, otherwise use current time
                Date lastCompletionTime = job.getLastRunAt() != null ?
                        Date.from(job.getLastRunAt().atZone(ZoneId.systemDefault()).toInstant()) :
                        new Date();
                return lastCompletionTime;
            });
            if (nextExecutionDate != null) {
                job.setNextRunAt(LocalDateTime.ofInstant(nextExecutionDate.toInstant(), ZoneId.systemDefault()));
                scrapingJobRepository.save(job); // Update next run time in DB
            }
            log.info("Scheduled job {} with cron: {}. Next run at: {}", job.getName(), job.getCronSchedule(), job.getNextRunAt());
        } catch (IllegalArgumentException e) {
            log.error("Invalid cron expression for job {}: {}", job.getName(), job.getCronSchedule(), e);
            // Optionally, update job status to FAILED or PENDING_ERROR
        }
    }

    public void rescheduleJob(ScrapingJob job) {
        unscheduleJob(job.getId()); // Cancel existing task
        scheduleJob(job);            // Schedule new/updated task
        log.info("Rescheduled job: {}", job.getName());
    }

    public void unscheduleJob(UUID jobId) {
        ScheduledFuture<?> future = scheduledTasks.remove(jobId);
        if (future != null) {
            future.cancel(false); // Do not interrupt if currently running
            log.info("Unscheduling job with ID: {}", jobId);
        }
    }
}
```