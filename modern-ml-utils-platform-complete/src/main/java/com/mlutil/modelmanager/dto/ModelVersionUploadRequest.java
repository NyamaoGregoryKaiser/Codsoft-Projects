```java
package com.mlutil.modelmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ModelVersionUploadRequest {
    @NotBlank(message = "Model path/identifier cannot be empty")
    private String modelPath; // S3 URI, Docker image name, etc.

    @NotBlank(message = "File name cannot be empty")
    private String fileName;

    @NotBlank(message = "File type cannot be empty")
    private String fileType; // e.g., ONNX, PMML, PICKLE

    private String metadata; // JSON string for additional details (e.g., input schema, accuracy)

    // Note: For simplicity, actual file upload handling is omitted in the service
    // but the API would typically accept MultipartFile.
    // private MultipartFile modelFile;
}
```