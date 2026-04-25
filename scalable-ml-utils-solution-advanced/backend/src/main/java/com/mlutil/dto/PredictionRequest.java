package com.mlutil.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class PredictionRequest {
    @NotNull(message = "Model ID cannot be null")
    private UUID modelId;
    private Integer versionNumber; // Optional, defaults to active version
    @NotNull(message = "Input data for prediction cannot be null")
    private Map<String, Object> inputData;
}