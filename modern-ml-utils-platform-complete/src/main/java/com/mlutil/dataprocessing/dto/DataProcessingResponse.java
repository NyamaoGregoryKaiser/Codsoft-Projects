```java
package com.mlutil.dataprocessing.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataProcessingResponse {
    private String processingType;
    private JsonNode processedData;
    private String message;
}
```