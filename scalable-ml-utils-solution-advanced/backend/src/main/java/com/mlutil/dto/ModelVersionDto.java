package com.mlutil.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ModelVersionDto {
    private UUID id;
    private UUID modelId;
    private Integer versionNumber;
    private String storagePath; // Expose path for dev/debug, not prod
    private Double accuracy;
    private Double precision;
    private Double recall;
    private Double f1Score;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}