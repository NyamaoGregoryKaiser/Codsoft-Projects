package com.mlutil.repository;

import com.mlutil.model.ModelVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModelVersionRepository extends JpaRepository<ModelVersion, UUID> {
    List<ModelVersion> findByModelIdOrderByVersionNumberDesc(UUID modelId);
    Optional<ModelVersion> findByModelIdAndVersionNumber(UUID modelId, Integer versionNumber);
    Optional<ModelVersion> findByModelIdAndIsActiveTrue(UUID modelId);
    boolean existsByModelIdAndVersionNumber(UUID modelId, Integer versionNumber);
}