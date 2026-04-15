package com.example.webscrapingtools.scraping.dto;

import com.example.webscrapingtools.scraping.model.ScrapingStatus;
import com.example.webscrapingtools.scraping.model.ScrapingTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapingTaskDTO {
    private Long id;
    private Long scraperDefinitionId;
    private String scraperDefinitionName;
    private ScrapingStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String errorMessage;
    private String executedByUsername;
    private LocalDateTime createdAt;

    public static ScrapingTaskDTO fromEntity(ScrapingTask entity) {
        return ScrapingTaskDTO.builder()
                .id(entity.getId())
                .scraperDefinitionId(entity.getScraperDefinition().getId())
                .scraperDefinitionName(entity.getScraperDefinition().getName())
                .status(entity.getStatus())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .errorMessage(entity.getErrorMessage())
                .executedByUsername(entity.getExecutedBy() != null ? entity.getExecutedBy().getUsername() : "Scheduler")
                .createdAt(entity.getCreatedAt())
                .build();
    }
}