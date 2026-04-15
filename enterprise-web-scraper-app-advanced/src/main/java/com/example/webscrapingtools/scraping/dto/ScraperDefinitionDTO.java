package com.example.webscrapingtools.scraping.dto;

import com.example.webscrapingtools.scraping.model.ScraperDefinition;
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
public class ScraperDefinitionDTO {
    private Long id;
    private String name;
    private String targetUrl;
    private String itemCssSelector;
    private Map<String, String> fieldDefinitions;
    private Integer scheduleIntervalMinutes;
    private boolean active;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ScraperDefinitionDTO fromEntity(ScraperDefinition entity, Map<String, String> fieldDefs) {
        return ScraperDefinitionDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .targetUrl(entity.getTargetUrl())
                .itemCssSelector(entity.getItemCssSelector())
                .fieldDefinitions(fieldDefs)
                .scheduleIntervalMinutes(entity.getScheduleIntervalMinutes())
                .active(entity.isActive())
                .createdByUsername(entity.getCreatedBy() != null ? entity.getCreatedBy().getUsername() : "N/A")
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}