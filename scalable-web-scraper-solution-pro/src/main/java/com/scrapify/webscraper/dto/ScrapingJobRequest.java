```java
package com.scrapify.webscraper.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class ScrapingJobRequest {
    @NotBlank(message = "Job name cannot be empty")
    private String name;

    @NotBlank(message = "Target URL cannot be empty")
    private String targetUrl;

    @NotNull(message = "Scraping configuration cannot be null")
    private Map<String, String> config; // e.g., "title": "h1.product-title", "price": "span.price"

    private String cronSchedule; // Optional cron expression
}
```