package com.example.webscrapingtools.scraping.controller;

import com.example.webscrapingtools.scraping.dto.ScrapingTaskDTO;
import com.example.webscrapingtools.scraping.repository.ScrapingTaskRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Scraping Tasks", description = "API for viewing scraping task history")
@Slf4j
public class ScrapingTaskController {

    private final ScrapingTaskRepository scrapingTaskRepository;

    @Operation(summary = "Get all scraping tasks", description = "Returns a paginated list of all scraping tasks. Can be filtered by scraper definition ID.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ScrapingTaskDTO>> getAllScrapingTasks(
            @Parameter(description = "Optional ID of the scraper definition to filter tasks by")
            @RequestParam(required = false) Long scraperDefinitionId,
            Pageable pageable) {
        log.debug("Fetching all scraping tasks with scraperDefinitionId: {} and pageable: {}", scraperDefinitionId, pageable);
        Page<ScrapingTaskDTO> tasks;
        if (scraperDefinitionId != null) {
            tasks = scrapingTaskRepository.findByScraperDefinitionId(scraperDefinitionId, pageable)
                    .map(ScrapingTaskDTO::fromEntity);
        } else {
            tasks = scrapingTaskRepository.findAll(pageable)
                    .map(ScrapingTaskDTO::fromEntity);
        }
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Get scraping task by ID", description = "Returns a single scraping task by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Scraping task found"),
            @ApiResponse(responseCode = "404", description = "Scraping task not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ScrapingTaskDTO> getScrapingTaskById(
            @Parameter(description = "ID of the scraping task to retrieve") @PathVariable Long id) {
        log.debug("Fetching scraping task with ID: {}", id);
        return scrapingTaskRepository.findById(id)
                .map(ScrapingTaskDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}