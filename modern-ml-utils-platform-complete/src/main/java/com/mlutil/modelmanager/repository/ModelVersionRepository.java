```java
package com.mlutil.modelmanager.repository;

import com.mlutil.modelmanager.entity.ModelVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ModelVersionRepository extends JpaRepository<ModelVersion, Long> {
    List<ModelVersion> findByModelIdOrderByVersionNumberDesc(Long modelId);
    Optional<ModelVersion> findByModelIdAndVersionNumber(Long modelId, Integer versionNumber);

    @Query("SELECT mv FROM ModelVersion mv WHERE mv.model.id = :modelId AND mv.isActive = true")
    Optional<ModelVersion> findActiveVersionByModelId(@Param("modelId") Long modelId);

    @Query("SELECT MAX(mv.versionNumber) FROM ModelVersion mv WHERE mv.model.id = :modelId")
    Optional<Integer> findMaxVersionNumberByModelId(@Param("modelId") Long modelId);
}
```