```java
package com.example.performancemonitor.controller;

import com.example.performancemonitor.model.SystemMetrics;
import com.example.performancemonitor.service.MetricsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @PostMapping
    public void saveMetrics(@RequestBody SystemMetrics metrics) {
        metricsService.saveMetrics(metrics);
    }

    // Add other endpoints for retrieval etc.
}
```