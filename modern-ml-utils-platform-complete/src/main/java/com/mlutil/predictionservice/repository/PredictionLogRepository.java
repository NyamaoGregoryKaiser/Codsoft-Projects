```java
package com.mlutil.predictionservice.repository;

import com.mlutil.predictionservice.entity.PredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PredictionLogRepository extends JpaRepository<PredictionLog, Long> {
    List<PredictionLog> findByModelIdOrderByPredictedAtDesc(Long modelId);
    List<PredictionLog> findByPredictedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    long countByModelId(Long modelId);
}
```