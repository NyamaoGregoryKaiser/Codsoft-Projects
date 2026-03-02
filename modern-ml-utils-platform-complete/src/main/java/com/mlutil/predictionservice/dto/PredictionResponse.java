```java
package com.mlutil.predictionservice.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {
    private String modelName;
    private Integer modelVersion;
    private JsonNode prediction; // Flexible JSON output
    private Long latencyMs;
}
```