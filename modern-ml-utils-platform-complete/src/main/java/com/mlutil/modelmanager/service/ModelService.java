```java
package com.mlutil.modelmanager.service;

import com.mlutil.core.exception.ResourceNotFoundException;
import com.mlutil.core.exception.ValidationException;
import com.mlutil.modelmanager.dto.ModelDto;
import com.mlutil.modelmanager.dto.ModelRegisterRequest;
import com.mlutil.modelmanager.dto.ModelVersionDto;
import com.mlutil.modelmanager.dto.ModelVersionUploadRequest;
import com.mlutil.modelmanager.entity.Model;
import com.mlutil.modelmanager.entity.ModelVersion;
import com.mlutil.modelmanager.mapper.ModelMapper;
import com.mlutil.modelmanager.repository.ModelRepository;
import com.mlutil.modelmanager.repository.ModelVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ModelService {

    private static final Logger logger = LoggerFactory.getLogger(ModelService.class);

    private final ModelRepository modelRepository;
    private final ModelVersionRepository modelVersionRepository;
    private final ModelMapper modelMapper;

    public ModelService(ModelRepository modelRepository, ModelVersionRepository modelVersionRepository, ModelMapper modelMapper) {
        this.modelRepository = modelRepository;
        this.modelVersionRepository = modelVersionRepository;
        this.modelMapper = modelMapper;
    }

    @Transactional
    @CacheEvict(value = "models", allEntries = true)
    public ModelDto registerModel(ModelRegisterRequest request, String owner) {
        if (modelRepository.existsByName(request.getName())) {
            throw new ValidationException("Model with name '" + request.getName() + "' already exists.");
        }
        Model model = modelMapper.toModelEntity(request, owner);
        Model savedModel = modelRepository.save(model);
        logger.info("Model registered: {}", savedModel.getName());
        return modelMapper.toModelDto(savedModel);
    }

    @Cacheable(value = "models", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort")
    public Page<ModelDto> getAllModels(Pageable pageable) {
        return modelRepository.findAll(pageable).map(modelMapper::toModelDto);
    }

    @Cacheable(value = "models", key = "#id")
    public ModelDto getModelById(Long id) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", id));
        return modelMapper.toModelDto(model);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelDto updateModel(Long id, ModelRegisterRequest request) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", id));

        if (!model.getName().equals(request.getName()) && modelRepository.existsByName(request.getName())) {
            throw new ValidationException("Another model with name '" + request.getName() + "' already exists.");
        }

        model.setName(request.getName());
        model.setDescription(request.getDescription());
        Model updatedModel = modelRepository.save(model);
        logger.info("Model updated: {}", updatedModel.getName());
        return modelMapper.toModelDto(updatedModel);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public void deleteModel(Long id) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", id));
        modelRepository.delete(model);
        logger.info("Model deleted with ID: {}", id);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelVersionDto uploadModelVersion(Long modelId, ModelVersionUploadRequest request) {
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", modelId));

        Integer nextVersionNumber = modelVersionRepository.findMaxVersionNumberByModelId(modelId)
                .map(max -> max + 1)
                .orElse(1);

        // Deactivate previous active version if exists for this model
        modelVersionRepository.findActiveVersionByModelId(modelId).ifPresent(prevActive -> {
            prevActive.setIsActive(false);
            modelVersionRepository.save(prevActive);
            logger.info("Deactivated previous active version {} for model {}", prevActive.getVersionNumber(), model.getName());
        });

        ModelVersion modelVersion = new ModelVersion();
        modelVersion.setModel(model);
        modelVersion.setVersionNumber(nextVersionNumber);
        modelVersion.setModelPath(request.getModelPath());
        modelVersion.setFileName(request.getFileName());
        modelVersion.setFileType(request.getFileType());
        modelVersion.setMetadata(request.getMetadata());
        modelVersion.setStatus("UPLOADED"); // Initial status
        modelVersion.setIsActive(true); // New version is active by default

        ModelVersion savedVersion = modelVersionRepository.save(modelVersion);
        logger.info("New version {} uploaded for model {}", savedVersion.getVersionNumber(), model.getName());
        return modelMapper.toModelVersionDto(savedVersion);
    }

    @Cacheable(value = "modelVersions", key = "'all-' + #modelId")
    public List<ModelVersionDto> getModelVersions(Long modelId) {
        List<ModelVersion> versions = modelVersionRepository.findByModelIdOrderByVersionNumberDesc(modelId);
        if (versions.isEmpty()) {
            throw new ResourceNotFoundException("Model Versions", "modelId", modelId);
        }
        return modelMapper.toModelVersionDtoList(versions);
    }

    @Cacheable(value = "modelVersions", key = "#modelId + '-' + #versionNumber")
    public ModelVersionDto getModelVersionByIdAndNumber(Long modelId, Integer versionNumber) {
        ModelVersion version = modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("ModelVersion", "modelId & versionNumber", modelId + ", " + versionNumber));
        return modelMapper.toModelVersionDto(version);
    }

    @Transactional
    @CacheEvict(value = {"models", "modelVersions"}, allEntries = true)
    public ModelVersionDto activateModelVersion(Long modelId, Integer versionNumber) {
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", modelId));

        ModelVersion newActiveVersion = modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("ModelVersion", "modelId & versionNumber", modelId + ", " + versionNumber));

        // Deactivate current active version
        modelVersionRepository.findActiveVersionByModelId(modelId).ifPresent(currentActive -> {
            if (!currentActive.getId().equals(newActiveVersion.getId())) {
                currentActive.setIsActive(false);
                modelVersionRepository.save(currentActive);
                logger.info("Deactivated previous active version {} for model {}", currentActive.getVersionNumber(), model.getName());
            }
        });

        // Activate the new version
        newActiveVersion.setIsActive(true);
        newActiveVersion.setStatus("DEPLOYED"); // Mark as deployed
        ModelVersion activatedVersion = modelVersionRepository.save(newActiveVersion);
        logger.info("Activated version {} for model {}", activatedVersion.getVersionNumber(), model.getName());
        return modelMapper.toModelVersionDto(activatedVersion);
    }

    @Cacheable(value = "modelVersions", key = "'active-' + #modelId")
    public ModelVersionDto getActiveModelVersion(Long modelId) {
        ModelVersion activeVersion = modelVersionRepository.findActiveVersionByModelId(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Active Model Version", "modelId", modelId));
        return modelMapper.toModelVersionDto(activeVersion);
    }
}
```