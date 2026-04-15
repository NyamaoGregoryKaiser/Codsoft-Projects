package com.example.webscrapingtools.scraping.controller;

import com.example.webscrapingtools.scraping.dto.ScrapedDataDTO;
import com.example.webscrapingtools.scraping.service.ScrapedDataService;
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
@RequestMapping("/api/data")
@RequiredArgsConstructor
@Tag(name = "Scraped Data", description = "API for viewing scraped data items")
@Slf4j
public class ScrapedDataController {

    private final ScrapedDataService scrapedDataService;

    @Operation(summary = "Get all scraped data items", description = "Returns a paginated list of all scraped data items. Can be filtered by task ID or scraper definition ID.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ScrapedDataDTO>> getAllScrapedData(
            @Parameter(description = "Optional ID of the scraping task to filter data by")
            @RequestParam(required = false) Long taskId,
            @Parameter(description = "Optional ID of the scraper definition to filter data by")
            @RequestParam(required = false) Long scraperDefinitionId,
            Pageable pageable) {
        log.debug("Fetching all scraped data with taskId: {}, scraperDefinitionId: {} and pageable: {}", taskId, scraperDefinitionId, pageable);
        Page<ScrapedDataDTO> data;
        if (taskId != null) {
            data = scrapedDataService.getScrapedDataByTaskId(taskId, pageable);
        } else if (scraperDefinitionId != null) {
            data = scrapedDataService.getScrapedDataByScraperDefinitionId(scraperDefinitionId, pageable);
        } else {
            data = scrapedDataService.getAllScrapedData(pageable);
        }
        return ResponseEntity.ok(data);
    }

    @Operation(summary = "Get scraped data item by ID", description = "Returns a single scraped data item by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Scraped data item found"),
            @ApiResponse(responseCode = "404", description = "Scraped data item not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ScrapedDataDTO> getScrapedDataById(
            @Parameter(description = "ID of the scraped data item to retrieve") @PathVariable Long id) {
        log.debug("Fetching scraped data item with ID: {}", id);
        ScrapedDataDTO data = scrapedDataService.getScrapedDataById(id);
        return ResponseEntity.ok(data);
    }
}