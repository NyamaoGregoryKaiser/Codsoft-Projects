```java
package com.mlutil.predictionservice.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PredictionRequest {
    @NotNull(message = "Input data for prediction cannot be null")
    private JsonNode inputData; // Flexible JSON input
}
```