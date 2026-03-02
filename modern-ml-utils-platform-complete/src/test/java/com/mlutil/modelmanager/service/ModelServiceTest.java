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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ModelService Unit Tests")
class ModelServiceTest {

    @Mock
    private ModelRepository modelRepository;
    @Mock
    private ModelVersionRepository modelVersionRepository;
    @Mock
    private ModelMapper modelMapper; // Inject the real mapper if it's a simple mapping, or mock for controlled behavior

    @InjectMocks
    private ModelService modelService;

    private Model model1;
    private ModelDto modelDto1;
    private ModelVersion mv1;
    private ModelVersionDto mvDto1;

    @BeforeEach
    void setUp() {
        model1 = new Model(1L, "Test Model 1", "Description 1", "testuser", LocalDateTime.now(), LocalDateTime.now(), Collections.emptyList());
        modelDto1 = new ModelDto();
        modelDto1.setId(1L);
        modelDto1.setName("Test Model 1");
        modelDto1.setDescription("Description 1");
        modelDto1.setOwner("testuser");

        mv1 = new ModelVersion(101L, model1, 1, "path/to/v1", "model_v1.onnx", "ONNX", "DEPLOYED", "{}", LocalDateTime.now(), true);
        mvDto1 = new ModelVersionDto();
        mvDto1.setId(101L);
        mvDto1.setModelId(1L);
        mvDto1.setVersionNumber(1);
        mvDto1.setFileName("model_v1.onnx");
        mvDto1.setFileType("ONNX");
        mvDto1.setIsActive(true);
    }

    @Test
    @DisplayName("Should register a new model successfully")
    void registerModel_Success() {
        ModelRegisterRequest request = new ModelRegisterRequest();
        request.setName("New Model");
        request.setDescription("New Model Description");

        Model newModel = new Model(null, "New Model", "New Model Description", "testuser", null, null, null);
        Model savedModel = new Model(2L, "New Model", "New Model Description", "testuser", LocalDateTime.now(), LocalDateTime.now(), Collections.emptyList());
        ModelDto savedModelDto = new ModelDto();
        savedModelDto.setId(2L);
        savedModelDto.setName("New Model");

        when(modelRepository.existsByName(request.getName())).thenReturn(false);
        when(modelMapper.toModelEntity(request, "testuser")).thenReturn(newModel);
        when(modelRepository.save(newModel)).thenReturn(savedModel);
        when(modelMapper.toModelDto(savedModel)).thenReturn(savedModelDto);

        ModelDto result = modelService.registerModel(request, "testuser");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getName()).isEqualTo("New Model");
        verify(modelRepository, times(1)).existsByName(request.getName());
        verify(modelRepository, times(1)).save(newModel);
    }

    @Test
    @DisplayName("Should throw ValidationException when registering model with existing name")
    void registerModel_ThrowsValidationException_ExistingName() {
        ModelRegisterRequest request = new ModelRegisterRequest();
        request.setName("Test Model 1");
        request.setDescription("Description");

        when(modelRepository.existsByName(request.getName())).thenReturn(true);

        assertThrows(ValidationException.class, () -> modelService.registerModel(request, "testuser"));
        verify(modelRepository, times(1)).existsByName(request.getName());
        verify(modelRepository, never()).save(any(Model.class));
    }

    @Test
    @DisplayName("Should retrieve all models with pagination")
    void getAllModels_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Model> modelsPage = new PageImpl<>(Collections.singletonList(model1), pageable, 1);
        Page<ModelDto> modelDtosPage = new PageImpl<>(Collections.singletonList(modelDto1), pageable, 1);

        when(modelRepository.findAll(pageable)).thenReturn(modelsPage);
        when(modelMapper.toModelDto(model1)).thenReturn(modelDto1);

        Page<ModelDto> result = modelService.getAllModels(pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Test Model 1");
        verify(modelRepository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("Should retrieve model by ID successfully")
    void getModelById_Success() {
        when(modelRepository.findById(1L)).thenReturn(Optional.of(model1));
        when(modelMapper.toModelDto(model1)).thenReturn(modelDto1);

        ModelDto result = modelService.getModelById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(modelRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when model not found by ID")
    void getModelById_ThrowsResourceNotFoundException() {
        when(modelRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> modelService.getModelById(99L));
        verify(modelRepository, times(1)).findById(99L);
    }

    @Test
    @DisplayName("Should update model successfully")
    void updateModel_Success() {
        ModelRegisterRequest updateRequest = new ModelRegisterRequest();
        updateRequest.setName("Updated Model Name");
        updateRequest.setDescription("Updated Description");

        Model existingModel = model1; // existingModel.name = "Test Model 1"
        Model updatedModelEntity = new Model(1L, "Updated Model Name", "Updated Description", "testuser", existingModel.getCreatedAt(), LocalDateTime.now(), Collections.emptyList());
        ModelDto updatedModelDto = new ModelDto();
        updatedModelDto.setId(1L);
        updatedModelDto.setName("Updated Model Name");

        when(modelRepository.findById(1L)).thenReturn(Optional.of(existingModel));
        when(modelRepository.existsByName(updateRequest.getName())).thenReturn(false);
        when(modelRepository.save(any(Model.class))).thenReturn(updatedModelEntity);
        when(modelMapper.toModelDto(updatedModelEntity)).thenReturn(updatedModelDto);

        ModelDto result = modelService.updateModel(1L, updateRequest);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Updated Model Name");
        assertThat(existingModel.getName()).isEqualTo("Updated Model Name"); // Verify that the entity object was modified
        verify(modelRepository, times(1)).findById(1L);
        verify(modelRepository, times(1)).save(any(Model.class));
    }

    @Test
    @DisplayName("Should throw ValidationException when updating model with existing name")
    void updateModel_ThrowsValidationException_ExistingName() {
        ModelRegisterRequest updateRequest = new ModelRegisterRequest();
        updateRequest.setName("Another Existing Model"); // Name that already exists for a different model
        updateRequest.setDescription("Updated Description");

        Model existingModel = model1; // existingModel.name = "Test Model 1"

        when(modelRepository.findById(1L)).thenReturn(Optional.of(existingModel));
        when(modelRepository.existsByName(updateRequest.getName())).thenReturn(true);

        assertThrows(ValidationException.class, () -> modelService.updateModel(1L, updateRequest));
        verify(modelRepository, times(1)).findById(1L);
        verify(modelRepository, times(1)).existsByName(updateRequest.getName());
        verify(modelRepository, never()).save(any(Model.class));
    }

    @Test
    @DisplayName("Should delete model successfully")
    void deleteModel_Success() {
        when(modelRepository.findById(1L)).thenReturn(Optional.of(model1));
        doNothing().when(modelRepository).delete(model1);

        modelService.deleteModel(1L);

        verify(modelRepository, times(1)).findById(1L);
        verify(modelRepository, times(1)).delete(model1);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent model")
    void deleteModel_ThrowsResourceNotFoundException() {
        when(modelRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> modelService.deleteModel(99L));
        verify(modelRepository, times(1)).findById(99L);
        verify(modelRepository, never()).delete(any(Model.class));
    }

    @Test
    @DisplayName("Should upload a new model version and set it active")
    void uploadModelVersion_Success() {
        ModelVersionUploadRequest request = new ModelVersionUploadRequest();
        request.setModelPath("new/path/v3");
        request.setFileName("model_v3.pmml");
        request.setFileType("PMML");
        request.setMetadata("{}");

        Model modelWithExistingVersions = new Model(1L, "Test Model 1", "Description 1", "testuser", LocalDateTime.now(), LocalDateTime.now(), Arrays.asList(mv1));
        ModelVersion oldActiveVersion = new ModelVersion(102L, modelWithExistingVersions, 2, "old/path", "old_v2.onnx", "ONNX", "DEPLOYED", "{}", LocalDateTime.now(), true);
        modelWithExistingVersions.getVersions().add(oldActiveVersion);

        ModelVersion newVersion = new ModelVersion(); // Will be populated by service
        newVersion.setModel(modelWithExistingVersions);
        newVersion.setVersionNumber(3);
        newVersion.setIsActive(true); // Should be set active

        ModelVersion savedNewVersion = new ModelVersion(103L, modelWithExistingVersions, 3, "new/path/v3", "model_v3.pmml", "PMML", "UPLOADED", "{}", LocalDateTime.now(), true);
        ModelVersionDto savedNewVersionDto = new ModelVersionDto();
        savedNewVersionDto.setId(103L);
        savedNewVersionDto.setVersionNumber(3);
        savedNewVersionDto.setIsActive(true);


        when(modelRepository.findById(1L)).thenReturn(Optional.of(modelWithExistingVersions));
        when(modelVersionRepository.findMaxVersionNumberByModelId(1L)).thenReturn(Optional.of(2)); // Max existing version
        when(modelVersionRepository.findActiveVersionByModelId(1L)).thenReturn(Optional.of(oldActiveVersion));
        when(modelVersionRepository.save(any(ModelVersion.class))).thenReturn(savedNewVersion);
        when(modelMapper.toModelVersionDto(savedNewVersion)).thenReturn(savedNewVersionDto);

        ModelVersionDto result = modelService.uploadModelVersion(1L, request);

        assertThat(result).isNotNull();
        assertThat(result.getVersionNumber()).isEqualTo(3);
        assertThat(result.getIsActive()).isTrue();
        assertThat(oldActiveVersion.getIsActive()).isFalse(); // Ensure old active is deactivated

        verify(modelVersionRepository, times(1)).findActiveVersionByModelId(1L);
        verify(modelVersionRepository, times(2)).save(any(ModelVersion.class)); // one for deactivating old, one for saving new
        verify(modelVersionRepository, times(1)).findMaxVersionNumberByModelId(1L);
    }

    @Test
    @DisplayName("Should retrieve all model versions for a given model ID")
    void getModelVersions_Success() {
        List<ModelVersion> versions = Arrays.asList(mv1, new ModelVersion()); // Add another dummy
        List<ModelVersionDto> versionDtos = Arrays.asList(mvDto1, new ModelVersionDto());

        when(modelVersionRepository.findByModelIdOrderByVersionNumberDesc(1L)).thenReturn(versions);
        when(modelMapper.toModelVersionDtoList(versions)).thenReturn(versionDtos);

        List<ModelVersionDto> result = modelService.getModelVersions(1L);

        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        verify(modelVersionRepository, times(1)).findByModelIdOrderByVersionNumberDesc(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException if no model versions exist")
    void getModelVersions_ThrowsResourceNotFoundException() {
        when(modelVersionRepository.findByModelIdOrderByVersionNumberDesc(anyLong())).thenReturn(Collections.emptyList());

        assertThrows(ResourceNotFoundException.class, () -> modelService.getModelVersions(1L));
        verify(modelVersionRepository, times(1)).findByModelIdOrderByVersionNumberDesc(1L);
    }

    @Test
    @DisplayName("Should retrieve model version by ID and version number")
    void getModelVersionByIdAndNumber_Success() {
        when(modelVersionRepository.findByModelIdAndVersionNumber(1L, 1)).thenReturn(Optional.of(mv1));
        when(modelMapper.toModelVersionDto(mv1)).thenReturn(mvDto1);

        ModelVersionDto result = modelService.getModelVersionByIdAndNumber(1L, 1);

        assertThat(result).isNotNull();
        assertThat(result.getVersionNumber()).isEqualTo(1);
        verify(modelVersionRepository, times(1)).findByModelIdAndVersionNumber(1L, 1);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for non-existent model version by ID and number")
    void getModelVersionByIdAndNumber_ThrowsResourceNotFoundException() {
        when(modelVersionRepository.findByModelIdAndVersionNumber(anyLong(), anyInt())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> modelService.getModelVersionByIdAndNumber(1L, 99));
        verify(modelVersionRepository, times(1)).findByModelIdAndVersionNumber(1L, 99);
    }

    @Test
    @DisplayName("Should activate a specific model version and deactivate the old one")
    void activateModelVersion_Success() {
        Model model = model1;
        ModelVersion oldActive = new ModelVersion(100L, model, 1, "path/v1", "v1.onnx", "ONNX", "DEPLOYED", "{}", LocalDateTime.now(), true);
        ModelVersion newToActivate = new ModelVersion(101L, model, 2, "path/v2", "v2.onnx", "ONNX", "UPLOADED", "{}", LocalDateTime.now(), false);

        ModelVersionDto activatedDto = new ModelVersionDto();
        activatedDto.setId(101L);
        activatedDto.setModelId(1L);
        activatedDto.setVersionNumber(2);
        activatedDto.setIsActive(true);

        when(modelRepository.findById(1L)).thenReturn(Optional.of(model));
        when(modelVersionRepository.findByModelIdAndVersionNumber(1L, 2)).thenReturn(Optional.of(newToActivate));
        when(modelVersionRepository.findActiveVersionByModelId(1L)).thenReturn(Optional.of(oldActive));
        when(modelVersionRepository.save(any(ModelVersion.class))).thenAnswer(invocation -> {
            ModelVersion mv = invocation.getArgument(0);
            return mv.getId() == 100L ? oldActive : newToActivate; // Return the saved version based on ID
        });
        when(modelMapper.toModelVersionDto(newToActivate)).thenReturn(activatedDto);

        ModelVersionDto result = modelService.activateModelVersion(1L, 2);

        assertThat(result).isNotNull();
        assertThat(result.getVersionNumber()).isEqualTo(2);
        assertThat(result.getIsActive()).isTrue();
        assertThat(oldActive.getIsActive()).isFalse(); // Verify old one is false
        assertThat(newToActivate.getIsActive()).isTrue(); // Verify new one is true
        verify(modelVersionRepository, times(2)).save(any(ModelVersion.class));
    }

    @Test
    @DisplayName("Should get the active model version successfully")
    void getActiveModelVersion_Success() {
        when(modelVersionRepository.findActiveVersionByModelId(1L)).thenReturn(Optional.of(mv1));
        when(modelMapper.toModelVersionDto(mv1)).thenReturn(mvDto1);

        ModelVersionDto result = modelService.getActiveModelVersion(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(101L);
        assertThat(result.getIsActive()).isTrue();
        verify(modelVersionRepository, times(1)).findActiveVersionByModelId(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when no active model version exists")
    void getActiveModelVersion_ThrowsResourceNotFoundException() {
        when(modelVersionRepository.findActiveVersionByModelId(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> modelService.getActiveModelVersion(1L));
        verify(modelVersionRepository, times(1)).findActiveVersionByModelId(1L);
    }
}
```