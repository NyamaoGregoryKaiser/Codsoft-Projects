```java
package com.mlutil.predictionservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long modelId;

    @Column(nullable = false)
    private Integer modelVersionNumber;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String requestPayload; // JSON string of input data

    @Column(columnDefinition = "TEXT", nullable = false)
    private String responsePayload; // JSON string of prediction output

    private String userId; // User who made the prediction request (can be anonymous)
    private String clientIp;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime predictedAt;

    private Long latencyMs; // Prediction latency in milliseconds
}
```