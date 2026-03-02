```java
package com.mlutil.dataprocessing.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class DataProcessingRequest {
    @NotNull(message = "Input data cannot be null")
    private JsonNode inputData;

    @NotBlank(message = "Processing type cannot be empty")
    private String processingType; // e.g., "MIN_MAX_SCALER", "ONE_HOT_ENCODER", "TEXT_VECTORIZER"

    private Map<String, String> params; // Parameters for the processing type
}
```