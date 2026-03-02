```java
package com.mlutil.modelmanager.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "model_versions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"model_id", "versionNumber"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModelVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id", nullable = false)
    private Model model;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(nullable = false)
    private String modelPath; // e.g., S3 path, local file path, or external service identifier
    private String fileName;
    private String fileType; // e.g., "ONNX", "PMML", "TFLITE", "SKLEARN_PICKLE"
    private String status; // e.g., "UPLOADED", "VALIDATED", "DEPLOYED", "ARCHIVED"
    private String metadata; // JSON string for additional metadata (e.g., input schema, metrics)

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    private Boolean isActive; // Marks if this version is currently active/recommended for inference
}
```