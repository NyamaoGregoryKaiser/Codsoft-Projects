package com.example.webscrapingtools.scraping.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScraperCreateRequest {
    @NotBlank(message = "Scraper name cannot be empty")
    private String name;

    @NotBlank(message = "Target URL cannot be empty")
    private String targetUrl;

    @NotBlank(message = "CSS Selector for items cannot be empty")
    private String itemCssSelector;

    @NotNull(message = "Field definitions cannot be null")
    private Map<String, String> fieldDefinitions; // { "fieldName": "cssSelector", ... }

    @Min(value = 0, message = "Schedule interval must be positive or 0 for manual only")
    private Integer scheduleIntervalMinutes; // 0 for manual, >0 for scheduled
}