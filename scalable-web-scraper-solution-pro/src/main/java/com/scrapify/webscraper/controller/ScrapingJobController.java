```java
package com.scrapify.webscraper.controller;

import com.scrapify.webscraper.dto.JobExecutionLogResponse;
import com.scrapify.webscraper.dto.ScrapedDataResponse;
import com.scrapify.webscraper.dto.ScrapingJobRequest;
import com.scrapify.webscraper.dto.ScrapingJobResponse;
import com.scrapify.webscraper.model.User;
import com.scrapify.webscraper.service.ScrapingJobService;
import com.scrapify.webscraper.service.ScraperService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Scraping Jobs", description = "APIs for managing web scraping jobs")
@SecurityRequirement(name = "bearerAuth")
public class ScrapingJobController {

    private final ScrapingJobService scrapingJobService;
    private final ScraperService scraperService;

    @Operation(summary = "Create a new scraping job")
    @PostMapping
    public ResponseEntity<ScrapingJobResponse> createScrapingJob(
            @Valid @RequestBody ScrapingJobRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} creating new scraping job: {}", currentUser.getUsername(), request.getName());
        ScrapingJobResponse response = scrapingJobService.createScrapingJob(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Operation(summary = "Get all scraping jobs for the authenticated user")
    @GetMapping
    public ResponseEntity<List<ScrapingJobResponse>> getAllScrapingJobs(
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} fetching all scraping jobs.", currentUser.getUsername());
        List<ScrapingJobResponse> jobs = scrapingJobService.getAllScrapingJobsForUser(currentUser);
        return ResponseEntity.ok(jobs);
    }

    @Operation(summary = "Get a specific scraping job by ID")
    @GetMapping("/{jobId}")
    public ResponseEntity<ScrapingJobResponse> getScrapingJobById(
            @Parameter(description = "ID of the scraping job") @PathVariable UUID jobId,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} fetching job with ID: {}", currentUser.getUsername(), jobId);
        ScrapingJobResponse job = scrapingJobService.getScrapingJobById(jobId, currentUser);
        return ResponseEntity.ok(job);
    }

    @Operation(summary = "Update an existing scraping job")
    @PutMapping("/{jobId}")
    public ResponseEntity<ScrapingJobResponse> updateScrapingJob(
            @Parameter(description = "ID of the scraping job to update") @PathVariable UUID jobId,
            @Valid @RequestBody ScrapingJobRequest request,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} updating job with ID: {}", currentUser.getUsername(), jobId);
        ScrapingJobResponse updatedJob = scrapingJobService.updateScrapingJob(jobId, request, currentUser);
        return ResponseEntity.ok(updatedJob);
    }

    @Operation(summary = "Delete a scraping job")
    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> deleteScrapingJob(
            @Parameter(description = "ID of the scraping job to delete") @PathVariable UUID jobId,
            @AuthenticationPrincipal User currentUser) {
        log.warn("User {} deleting job with ID: {}", currentUser.getUsername(), jobId);
        scrapingJobService.deleteScrapingJob(jobId, currentUser);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @Operation(summary = "Manually trigger a scraping job execution")
    @PostMapping("/{jobId}/run")
    public ResponseEntity<String> runScrapingJob(
            @Parameter(description = "ID of the scraping job to run") @PathVariable UUID jobId,
            @AuthenticationPrincipal User currentUser) {
        log.info("User {} manually triggering job with ID: {}", currentUser.getUsername(), jobId);
        // This method can be made async if job execution is long-running
        scraperService.executeScrapingJob(jobId);
        return ResponseEntity.ok("Scraping job triggered successfully. Check logs for status.");
    }

    @Operation(summary = "Get scraped data for a job")
    @GetMapping("/{jobId}/data")
    public ResponseEntity<Page<ScrapedDataResponse>> getScrapedDataForJob(
            @Parameter(description = "ID of the scraping job") @PathVariable UUID jobId,
            @AuthenticationPrincipal User currentUser,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size) {
        log.debug("User {} fetching scraped data for job ID: {} (page={}, size={})", currentUser.getUsername(), jobId, page, size);
        Page<ScrapedDataResponse> data = scrapingJobService.getScrapedDataForJob(jobId, currentUser, page, size);
        return ResponseEntity.ok(data);
    }

    @Operation(summary = "Get execution logs for a job")
    @GetMapping("/{jobId}/logs")
    public ResponseEntity<Page<JobExecutionLogResponse>> getJobExecutionLogs(
            @Parameter(description = "ID of the scraping job") @PathVariable UUID jobId,
            @AuthenticationPrincipal User currentUser,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size) {
        log.debug("User {} fetching job execution logs for job ID: {} (page={}, size={})", currentUser.getUsername(), jobId, page, size);
        Page<JobExecutionLogResponse> logs = scrapingJobService.getJobExecutionLogs(jobId, currentUser, page, size);
        return ResponseEntity.ok(logs);
    }
}
```