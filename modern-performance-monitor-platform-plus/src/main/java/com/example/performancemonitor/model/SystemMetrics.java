```java
package com.example.performancemonitor.model;

import jakarta.persistence.*;

@Entity
public class SystemMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private double cpuUsage;
    private long memoryUsage;
    private long timestamp;

    // Getters and setters
}
```