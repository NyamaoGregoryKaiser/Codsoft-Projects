package com.example.webscrapingtools.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class WebScraperFormDTO {
    private Long id; // For updates

    @NotBlank(message = "Scraper name cannot be empty")
    private String name;

    @NotBlank(message = "Target URL cannot be empty")
    @Pattern(regexp = "^(https?|ftp|file)://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]", message = "Invalid URL format")
    private String targetUrl;

    @NotBlank(message = "CSS Selector for items cannot be empty")
    private String itemCssSelector;

    @NotBlank(message = "Field definitions cannot be empty (JSON format)")
    private String fieldDefinitionsJson; // JSON string for map input

    @Min(value = 0, message = "Schedule interval must be positive or 0 for manual only")
    private Integer scheduleIntervalMinutes = 0;

    private boolean active = true;
}