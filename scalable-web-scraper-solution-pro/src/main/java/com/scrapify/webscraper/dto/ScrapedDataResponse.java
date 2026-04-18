```java
package com.scrapify.webscraper.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapedDataResponse {
    private UUID id;
    private UUID jobId;
    private String jobName;
    private Map<String, String> data;
    private String scrapedUrl;
    private LocalDateTime scrapedAt;
}
```