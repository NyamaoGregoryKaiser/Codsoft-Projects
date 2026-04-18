```java
package com.scrapify.webscraper.service;

import com.scrapify.webscraper.dto.JobExecutionLogResponse;
import com.scrapify.webscraper.dto.ScrapedDataResponse;
import com.scrapify.webscraper.dto.ScrapingJobRequest;
import com.scrapify.webscraper.dto.ScrapingJobResponse;
import com.scrapify.webscraper.exception.ResourceNotFoundException;
import com.scrapify.webscraper.model.JobExecutionLog;
import com.scrapify.webscraper.model.ScrapedData;
import com.scrapify.webscraper.model.ScrapingJob;
import com.scrapify.webscraper.model.User;
import com.scrapify.webscraper.repository.JobExecutionLogRepository;
import com.scrapify.webscraper.repository.ScrapedDataRepository;
import com.scrapify.webscraper.repository.ScrapingJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScrapingJobService {

    private final ScrapingJobRepository scrapingJobRepository;
    private final ScrapedDataRepository scrapedDataRepository;
    private final JobExecutionLogRepository jobExecutionLogRepository;
    private final SchedulerService schedulerService;

    @Transactional
    @CacheEvict(value = {"scrapingJobs", "scrapedData", "jobExecutionLogs"}, allEntries = true)
    public ScrapingJobResponse createScrapingJob(ScrapingJobRequest request, User currentUser) {
        ScrapingJob job = ScrapingJob.builder()
                .name(request.getName())
                .targetUrl(request.getTargetUrl())
                .config(request.getConfig())
                .cronSchedule(request.getCronSchedule())
                .user(currentUser)
                .build();
        ScrapingJob savedJob = scrapingJobRepository.save(job);

        if (savedJob.getCronSchedule() != null && !savedJob.getCronSchedule().isBlank()) {
            schedulerService.scheduleJob(savedJob);
        }

        log.info("Created new scraping job: {} by user {}", savedJob.getName(), currentUser.getUsername());
        return mapToScrapingJobResponse(savedJob);
    }

    @Cacheable(value = "scrapingJobs", key = "#jobId")
    public ScrapingJobResponse getScrapingJobById(UUID jobId, User currentUser) {
        ScrapingJob job = scrapingJobRepository.findByIdAndUser(jobId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Scraping Job not found or not owned by user with id: " + jobId));
        return mapToScrapingJobResponse(job);
    }

    @Cacheable(value = "scrapingJobs", key = "'user:' + #currentUser.username")
    public List<ScrapingJobResponse> getAllScrapingJobsForUser(User currentUser) {
        return scrapingJobRepository.findByUser(currentUser).stream()
                .map(this::mapToScrapingJobResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"scrapingJobs", "scrapedData", "jobExecutionLogs"}, allEntries = true)
    @PreAuthorize("hasRole('ADMIN') or @scrapingJobService.isJobOwner(#jobId, authentication.principal.username)")
    public ScrapingJobResponse updateScrapingJob(UUID jobId, ScrapingJobRequest request, User currentUser) {
        ScrapingJob existingJob = scrapingJobRepository.findByIdAndUser(jobId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Scraping Job not found or not owned by user with id: " + jobId));

        existingJob.setName(request.getName());
        existingJob.setTargetUrl(request.getTargetUrl());
        existingJob.setConfig(request.getConfig());
        existingJob.setCronSchedule(request.getCronSchedule());

        ScrapingJob updatedJob = scrapingJobRepository.save(existingJob);

        schedulerService.rescheduleJob(updatedJob); // Update or remove schedule if cron changed

        log.info("Updated scraping job: {} (ID: {}) by user {}", updatedJob.getName(), updatedJob.getId(), currentUser.getUsername());
        return mapToScrapingJobResponse(updatedJob);
    }

    @Transactional
    @CacheEvict(value = {"scrapingJobs", "scrapedData", "jobExecutionLogs"}, allEntries = true)
    @PreAuthorize("hasRole('ADMIN') or @scrapingJobService.isJobOwner(#jobId, authentication.principal.username)")
    public void deleteScrapingJob(UUID jobId, User currentUser) {
        ScrapingJob job = scrapingJobRepository.findByIdAndUser(jobId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Scraping Job not found or not owned by user with id: " + jobId));

        schedulerService.unscheduleJob(jobId);
        scrapedDataRepository.deleteByScrapingJobId(jobId); // Delete associated data
        jobExecutionLogRepository.deleteByScrapingJob(job); // Delete associated logs
        scrapingJobRepository.delete(job);
        log.warn("Deleted scraping job: {} (ID: {}) by user {}", job.getName(), job.getId(), currentUser.getUsername());
    }

    @Cacheable(value = "scrapedData", key = "#jobId + '-' + #page + '-' + #size")
    public Page<ScrapedDataResponse> getScrapedDataForJob(UUID jobId, User currentUser, int page, int size) {
        ScrapingJob job = scrapingJobRepository.findByIdAndUser(jobId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Scraping Job not found or not owned by user with id: " + jobId));

        Pageable pageable = PageRequest.of(page, size, Sort.by("scrapedAt").descending());
        return scrapedDataRepository.findByScrapingJobId(jobId, pageable)
                .map(this::mapToScrapedDataResponse);
    }

    @Cacheable(value = "jobExecutionLogs", key = "#jobId + '-' + #page + '-' + #size")
    public Page<JobExecutionLogResponse> getJobExecutionLogs(UUID jobId, User currentUser, int page, int size) {
        ScrapingJob job = scrapingJobRepository.findByIdAndUser(jobId, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Scraping Job not found or not owned by user with id: " + jobId));

        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        return jobExecutionLogRepository.findByScrapingJobId(jobId, pageable)
                .map(this::mapToJobExecutionLogResponse);
    }

    // Helper method for PreAuthorize to check ownership
    public boolean isJobOwner(UUID jobId, String username) {
        return scrapingJobRepository.findById(jobId)
                .map(job -> job.getUser().getUsername().equals(username))
                .orElse(false);
    }


    private ScrapingJobResponse mapToScrapingJobResponse(ScrapingJob job) {
        return ScrapingJobResponse.builder()
                .id(job.getId())
                .name(job.getName())
                .targetUrl(job.getTargetUrl())
                .config(job.getConfig())
                .status(job.getStatus())
                .cronSchedule(job.getCronSchedule())
                .lastRunAt(job.getLastRunAt())
                .nextRunAt(job.getNextRunAt())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .createdByUsername(job.getUser().getUsername())
                .build();
    }

    private ScrapedDataResponse mapToScrapedDataResponse(ScrapedData data) {
        return ScrapedDataResponse.builder()
                .id(data.getId())
                .jobId(data.getScrapingJob().getId())
                .jobName(data.getScrapingJob().getName())
                .data(data.getData())
                .scrapedUrl(data.getScrapedUrl())
                .scrapedAt(data.getScrapedAt())
                .build();
    }

    private JobExecutionLogResponse mapToJobExecutionLogResponse(JobExecutionLog logEntry) {
        return JobExecutionLogResponse.builder()
                .id(logEntry.getId())
                .jobId(logEntry.getScrapingJob().getId())
                .status(logEntry.getStatus())
                .startTime(logEntry.getStartTime())
                .endTime(logEntry.getEndTime())
                .errorMessage(logEntry.getErrorMessage())
                .dataCount(logEntry.getDataCount())
                .build();
    }
}
```