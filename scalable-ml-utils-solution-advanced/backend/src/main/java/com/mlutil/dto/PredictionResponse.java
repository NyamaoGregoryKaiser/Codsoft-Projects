package com.mlutil.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {
    private UUID modelId;
    private Integer versionNumber;
    private Map<String, Object> predictionResult;
    private String message;
}