package com.example.webscrapingtools.scraping.dto;

import jakarta.validation.constraints.Min;
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
public class ScraperUpdateRequest {
    private String name;
    private String targetUrl;
    private String itemCssSelector;
    private Map<String, String> fieldDefinitions;
    @Min(value = 0, message = "Schedule interval must be positive or 0 for manual only")
    private Integer scheduleIntervalMinutes;
    private Boolean active;
}