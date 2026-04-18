```java
package com.scrapify.webscraper.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scraped_data")
public class ScrapedData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private ScrapingJob scrapingJob;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> data; // The actual scraped key-value pairs

    @Column(name = "scraped_url", nullable = false)
    private String scrapedUrl;

    @Column(name = "scraped_at", nullable = false, updatable = false)
    private LocalDateTime scrapedAt;

    @PrePersist
    protected void onCreate() {
        this.scrapedAt = LocalDateTime.now();
    }
}
```