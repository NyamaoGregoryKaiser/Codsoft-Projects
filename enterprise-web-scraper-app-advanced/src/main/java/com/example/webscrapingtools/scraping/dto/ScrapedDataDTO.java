package com.example.webscrapingtools.scraping.dto;

import com.example.webscrapingtools.scraping.model.ScrapedDataItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapedDataDTO {
    private Long id;
    private Long scrapingTaskId;
    private Long scraperDefinitionId;
    private String scraperDefinitionName;
    private Map<String, String> data;
    private LocalDateTime scrapedAt;

    public static ScrapedDataDTO fromEntity(ScrapedDataItem entity) {
        return ScrapedDataDTO.builder()
                .id(entity.getId())
                .scrapingTaskId(entity.getScrapingTask().getId())
                .scraperDefinitionId(entity.getScraperDefinition().getId())
                .scraperDefinitionName(entity.getScraperDefinition().getName())
                .data(entity.getData())
                .scrapedAt(entity.getScrapedAt())
                .build();
    }
}