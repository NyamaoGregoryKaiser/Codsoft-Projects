package com.mlutil.service;

import com.mlutil.dto.ModelDto;
import com.mlutil.dto.ModelVersionDto;
import com.mlutil.exception.BadRequestException;
import com.mlutil.exception.ResourceNotFoundException;
import com.mlutil.model.Model;
import com.mlutil.model.ModelVersion;
import com.mlutil.repository.ModelRepository;
import com.mlutil.repository.ModelVersionRepository;
import com.mlutil.util.ModelStorageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModelService {

    private final ModelRepository modelRepository;
    private final ModelVersionRepository modelVersionRepository;
    private final ModelStorageUtil modelStorageUtil;

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelDto createModel(ModelDto modelDto) {
        if (modelRepository.existsByName(modelDto.getName())) {
            throw new BadRequestException("Model with name '" + modelDto.getName() + "' already exists.");
        }
        Model model = new Model(modelDto.getName(), modelDto.getDescription());
        Model savedModel = modelRepository.save(model);
        log.info("Created new model: {}", savedModel.getName());
        return toDto(savedModel);
    }

    @Cacheable(value = "models", key = "'allModels'")
    public List<ModelDto> getAllModels() {
        return modelRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "models", key = "#id")
    public ModelDto getModelById(UUID id) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", id));
        return toDto(model);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelDto updateModel(UUID id, ModelDto modelDto) {
        Model existingModel = modelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", id));

        if (!existingModel.getName().equals(modelDto.getName()) && modelRepository.existsByName(modelDto.getName())) {
            throw new BadRequestException("Model with name '" + modelDto.getName() + "' already exists.");
        }

        existingModel.setName(modelDto.getName());
        existingModel.setDescription(modelDto.getDescription());
        Model updatedModel = modelRepository.save(existingModel);
        log.info("Updated model: {}", updatedModel.getName());
        return toDto(updatedModel);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public void deleteModel(UUID id) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", id));

        // Clean up stored model files associated with this model
        model.getVersions().forEach(modelVersion -> {
            try {
                modelStorageUtil.deleteModelFile(modelVersion.getStoragePath());
                log.info("Deleted model file for version {}: {}", modelVersion.getId(), modelVersion.getStoragePath());
            } catch (IOException e) {
                log.error("Failed to delete model file {}: {}", modelVersion.getStoragePath(), e.getMessage());
                // Continue with DB deletion even if file deletion fails
            }
        });

        modelRepository.delete(model);
        log.info("Deleted model with id: {}", id);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelVersionDto uploadModelVersion(UUID modelId, MultipartFile file,
                                              Double accuracy, Double precision, Double recall, Double f1Score) {
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", modelId));

        int nextVersionNumber = modelVersionRepository.findByModelIdOrderByVersionNumberDesc(modelId)
                .stream()
                .map(ModelVersion::getVersionNumber)
                .max(Integer::compare)
                .orElse(0) + 1;

        String storagePath;
        try {
            storagePath = modelStorageUtil.saveModelFile(modelId, nextVersionNumber, file);
        } catch (IOException e) {
            log.error("Failed to save model file for modelId {} version {}: {}", modelId, nextVersionNumber, e.getMessage());
            throw new BadRequestException("Failed to store model file: " + e.getMessage());
        }

        ModelVersion newVersion = new ModelVersion(model, nextVersionNumber, storagePath);
        newVersion.setAccuracy(accuracy);
        newVersion.setPrecision(precision);
        newVersion.setRecall(recall);
        newVersion.setF1Score(f1Score);
        newVersion.setIsActive(false); // Initially not active, needs to be set explicitly

        ModelVersion savedVersion = modelVersionRepository.save(newVersion);
        log.info("Uploaded new version {} for model {}. Stored at: {}", nextVersionNumber, model.getName(), storagePath);
        return toDto(savedVersion);
    }

    @Cacheable(value = "modelVersions", key = "#modelId + '_' + #versionNumber")
    public ModelVersionDto getModelVersion(UUID modelId, Integer versionNumber) {
        ModelVersion modelVersion = modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Model Version", "modelId and versionNumber", modelId + "/" + versionNumber));
        return toDto(modelVersion);
    }

    @Cacheable(value = "modelVersions", key = "#modelId + '_active'")
    public ModelVersionDto getActiveModelVersion(UUID modelId) {
        ModelVersion modelVersion = modelVersionRepository.findByModelIdAndIsActiveTrue(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Active Model Version", "modelId", modelId));
        return toDto(modelVersion);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelVersionDto activateModelVersion(UUID modelId, Integer versionNumber) {
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", modelId));

        // Deactivate current active version
        modelVersionRepository.findByModelIdAndIsActiveTrue(modelId).ifPresent(currentActive -> {
            currentActive.setIsActive(false);
            modelVersionRepository.save(currentActive);
        });

        // Activate the specified version
        ModelVersion versionToActivate = modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Model Version", "modelId and versionNumber", modelId + "/" + versionNumber));
        versionToActivate.setIsActive(true);
        ModelVersion activatedVersion = modelVersionRepository.save(versionToActivate);
        log.info("Activated version {} for model {}", versionNumber, model.getName());
        return toDto(activatedVersion);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public void deleteModelVersion(UUID modelId, Integer versionNumber) {
        ModelVersion modelVersion = modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Model Version", "modelId and versionNumber", modelId + "/" + versionNumber));

        if (modelVersion.getIsActive()) {
            throw new BadRequestException("Cannot delete an active model version. Deactivate it first.");
        }

        try {
            modelStorageUtil.deleteModelFile(modelVersion.getStoragePath());
            log.info("Deleted model file for version {}: {}", modelVersion.getId(), modelVersion.getStoragePath());
        } catch (IOException e) {
            log.error("Failed to delete model file {}: {}", modelVersion.getStoragePath(), e.getMessage());
            throw new RuntimeException("Failed to delete model file from storage: " + e.getMessage());
        }

        modelVersionRepository.delete(modelVersion);
        log.info("Deleted model version {} for model ID {}", versionNumber, modelId);
    }

    private ModelDto toDto(Model model) {
        ModelDto dto = new ModelDto();
        dto.setId(model.getId());
        dto.setName(model.getName());
        dto.setDescription(model.getDescription());
        dto.setCreatedAt(model.getCreatedAt());
        dto.setUpdatedAt(model.getUpdatedAt());
        // Only fetch versions if explicitly requested or needed (e.g., in a detailed view)
        if (model.getVersions() != null && !model.getVersions().isEmpty()) {
            dto.setVersions(model.getVersions().stream()
                    .map(this::toDto)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private ModelVersionDto toDto(ModelVersion version) {
        ModelVersionDto dto = new ModelVersionDto();
        dto.setId(version.getId());
        dto.setModelId(version.getModel().getId());
        dto.setVersionNumber(version.getVersionNumber());
        dto.setStoragePath(version.getStoragePath());
        dto.setAccuracy(version.getAccuracy());
        dto.setPrecision(version.getPrecision());
        dto.setRecall(version.getRecall());
        dto.setF1Score(version.getF1Score());
        dto.setIsActive(version.getIsActive());
        dto.setCreatedAt(version.getCreatedAt());
        return dto;
    }
}