package com.example.webscrapingtools.scraping.controller;

import com.example.webscrapingtools.auth.model.User;
import com.example.webscrapingtools.auth.repository.UserRepository;
import com.example.webscrapingtools.common.error.ResourceNotFoundException;
import com.example.webscrapingtools.scraping.dto.ScraperCreateRequest;
import com.example.webscrapingtools.scraping.dto.ScraperDefinitionDTO;
import com.example.webscrapingtools.scraping.dto.ScraperUpdateRequest;
import com.example.webscrapingtools.scraping.dto.ScrapingTaskDTO;
import com.example.webscrapingtools.scraping.model.ScrapingTask;
import com.example.webscrapingtools.scraping.service.ScraperDefinitionService;
import com.example.webscrapingtools.scraping.service.ScrapingService;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scrapers")
@RequiredArgsConstructor
@Tag(name = "Scrapers", description = "API for managing web scraper definitions and triggering tasks")
@Slf4j
public class ScraperController {

    private final ScraperDefinitionService scraperDefinitionService;
    private final ScrapingService scrapingService;
    private final UserRepository userRepository; // To get current authenticated user

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof User user) {
            return userRepository.findByUsername(user.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in DB."));
        }
        throw new IllegalStateException("User not authenticated.");
    }

    @Operation(summary = "Get all scraper definitions", description = "Returns a paginated list of all scraper definitions.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ScraperDefinitionDTO>> getAllScrapers(Pageable pageable) {
        log.debug("Fetching all scraper definitions with pageable: {}", pageable);
        Page<ScraperDefinitionDTO> scrapers = scraperDefinitionService.getAllScrapers(pageable);
        return ResponseEntity.ok(scrapers);
    }

    @Operation(summary = "Get scraper definition by ID", description = "Returns a single scraper definition by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Scraper definition found"),
            @ApiResponse(responseCode = "404", description = "Scraper definition not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ScraperDefinitionDTO> getScraperById(
            @Parameter(description = "ID of the scraper definition to retrieve") @PathVariable Long id) {
        log.debug("Fetching scraper definition with ID: {}", id);
        ScraperDefinitionDTO scraper = scraperDefinitionService.getScraperById(id);
        return ResponseEntity.ok(scraper);
    }

    @Operation(summary = "Create a new scraper definition", description = "Creates a new web scraper definition.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Scraper definition created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Scraper with this name already exists")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ScraperDefinitionDTO> createScraper(@Valid @RequestBody ScraperCreateRequest request) throws JsonProcessingException {
        log.info("Creating new scraper definition with name: {}", request.getName());
        ScraperDefinitionDTO newScraper = scraperDefinitionService.createScraper(request, getCurrentUser());
        return new ResponseEntity<>(newScraper, HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing scraper definition", description = "Updates an existing web scraper definition by ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Scraper definition updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Scraper definition not found"),
            @ApiResponse(responseCode = "409", description = "Scraper with this name already exists")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ScraperDefinitionDTO> updateScraper(
            @Parameter(description = "ID of the scraper definition to update") @PathVariable Long id,
            @Valid @RequestBody ScraperUpdateRequest request) throws JsonProcessingException {
        log.info("Updating scraper definition with ID: {}", id);
        ScraperDefinitionDTO updatedScraper = scraperDefinitionService.updateScraper(id, request);
        return ResponseEntity.ok(updatedScraper);
    }

    @Operation(summary = "Delete a scraper definition", description = "Deletes a web scraper definition by ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Scraper definition deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Scraper definition not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Void> deleteScraper(
            @Parameter(description = "ID of the scraper definition to delete") @PathVariable Long id) {
        log.info("Deleting scraper definition with ID: {}", id);
        scraperDefinitionService.deleteScraper(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Manually trigger a scraping task", description = "Triggers a scraping task for a given scraper definition.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "Scraping task triggered successfully"),
            @ApiResponse(responseCode = "404", description = "Scraper definition not found")
    })
    @PostMapping("/{id}/run")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ScrapingTaskDTO> triggerScraping(
            @Parameter(description = "ID of the scraper definition to run") @PathVariable Long id) {
        log.info("Manually triggering scraping for scraper definition ID: {}", id);
        ScrapingTask task = scrapingService.triggerScraping(id, getCurrentUser());
        return new ResponseEntity<>(ScrapingTaskDTO.fromEntity(task), HttpStatus.ACCEPTED);
    }
}