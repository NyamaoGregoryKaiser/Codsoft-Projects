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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ModelServiceTest {

    @Mock
    private ModelRepository modelRepository;
    @Mock
    private ModelVersionRepository modelVersionRepository;
    @Mock
    private ModelStorageUtil modelStorageUtil;

    @InjectMocks
    private ModelService modelService;

    private UUID modelId;
    private Model model;
    private ModelDto modelDto;

    @BeforeEach
    void setUp() {
        modelId = UUID.randomUUID();
        model = new Model("Test Model", "A model for testing purposes");
        model.setId(modelId);
        model.setCreatedAt(OffsetDateTime.now());
        model.setUpdatedAt(OffsetDateTime.now());
        model.setVersions(Collections.emptyList());

        modelDto = new ModelDto();
        modelDto.setId(modelId);
        modelDto.setName(model.getName());
        modelDto.setDescription(model.getDescription());
    }

    @Test
    void createModel_Success() {
        when(modelRepository.existsByName(anyString())).thenReturn(false);
        when(modelRepository.save(any(Model.class))).thenReturn(model);

        ModelDto result = modelService.createModel(modelDto);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(modelDto.getName());
        verify(modelRepository, times(1)).existsByName(modelDto.getName());
        verify(modelRepository, times(1)).save(any(Model.class));
    }

    @Test
    void createModel_NameAlreadyExists_ThrowsBadRequestException() {
        when(modelRepository.existsByName(anyString())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> modelService.createModel(modelDto));
        verify(modelRepository, times(1)).existsByName(modelDto.getName());
        verify(modelRepository, never()).save(any(Model.class));
    }

    @Test
    void getModelById_Success() {
        when(modelRepository.findById(modelId)).thenReturn(Optional.of(model));

        ModelDto result = modelService.getModelById(modelId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(modelId);
        verify(modelRepository, times(1)).findById(modelId);
    }

    @Test
    void getModelById_NotFound_ThrowsResourceNotFoundException() {
        when(modelRepository.findById(modelId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> modelService.getModelById(modelId));
        verify(modelRepository, times(1)).findById(modelId);
    }

    @Test
    void deleteModel_Success() throws IOException {
        ModelVersion mv = new ModelVersion(model, 1, "model_file.pkl");
        mv.setId(UUID.randomUUID());
        model.setVersions(List.of(mv));
        when(modelRepository.findById(modelId)).thenReturn(Optional.of(model));
        doNothing().when(modelStorageUtil).deleteModelFile(anyString());
        doNothing().when(modelRepository).delete(any(Model.class));

        modelService.deleteModel(modelId);

        verify(modelRepository, times(1)).findById(modelId);
        verify(modelStorageUtil, times(1)).deleteModelFile(mv.getStoragePath());
        verify(modelRepository, times(1)).delete(model);
    }

    @Test
    void uploadModelVersion_Success() throws IOException {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.pkl", "application/octet-stream", "model_data".getBytes());

        ModelVersion existingVersion = new ModelVersion(model, 1, "path/to/v1");
        when(modelRepository.findById(modelId)).thenReturn(Optional.of(model));
        when(modelVersionRepository.findByModelIdOrderByVersionNumberDesc(modelId))
                .thenReturn(List.of(existingVersion)); // Simulate existing version
        when(modelStorageUtil.saveModelFile(any(UUID.class), anyInt(), any(MultipartFile.class)))
                .thenReturn("new_version_path.pkl");
        when(modelVersionRepository.save(any(ModelVersion.class))).thenAnswer(invocation -> {
            ModelVersion mv = invocation.getArgument(0);
            mv.setId(UUID.randomUUID());
            return mv;
        });

        ModelVersionDto result = modelService.uploadModelVersion(modelId, mockFile, 0.9, 0.8, 0.7, 0.85);

        assertThat(result).isNotNull();
        assertThat(result.getVersionNumber()).isEqualTo(2); // Next version
        assertThat(result.getStoragePath()).isEqualTo("new_version_path.pkl");
        assertThat(result.getAccuracy()).isEqualTo(0.9);
        verify(modelVersionRepository, times(1)).save(any(ModelVersion.class));
    }

    @Test
    void activateModelVersion_Success() {
        ModelVersion currentActive = new ModelVersion(model, 1, "path/v1");
        currentActive.setIsActive(true);
        ModelVersion newVersion = new ModelVersion(model, 2, "path/v2");
        newVersion.setIsActive(false);

        when(modelRepository.findById(modelId)).thenReturn(Optional.of(model));
        when(modelVersionRepository.findByModelIdAndIsActiveTrue(modelId)).thenReturn(Optional.of(currentActive));
        when(modelVersionRepository.findByModelIdAndVersionNumber(modelId, 2)).thenReturn(Optional.of(newVersion));
        when(modelVersionRepository.save(any(ModelVersion.class))).thenAnswer(i -> i.getArguments()[0]);

        ModelVersionDto result = modelService.activateModelVersion(modelId, 2);

        assertThat(result).isNotNull();
        assertThat(result.getVersionNumber()).isEqualTo(2);
        assertThat(result.getIsActive()).isTrue();
        assertFalse(currentActive.getIsActive()); // Original object should be updated
        verify(modelVersionRepository, times(2)).save(any(ModelVersion.class)); // One for deactivating, one for activating
    }

    @Test
    void deleteModelVersion_Success() throws IOException {
        int versionNumber = 1;
        ModelVersion mv = new ModelVersion(model, versionNumber, "test_path.pkl");
        mv.setId(UUID.randomUUID());
        mv.setIsActive(false); // Must not be active

        when(modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)).thenReturn(Optional.of(mv));
        doNothing().when(modelStorageUtil).deleteModelFile(anyString());
        doNothing().when(modelVersionRepository).delete(any(ModelVersion.class));

        modelService.deleteModelVersion(modelId, versionNumber);

        verify(modelVersionRepository, times(1)).findByModelIdAndVersionNumber(modelId, versionNumber);
        verify(modelStorageUtil, times(1)).deleteModelFile(mv.getStoragePath());
        verify(modelVersionRepository, times(1)).delete(mv);
    }

    @Test
    void deleteModelVersion_ActiveVersion_ThrowsBadRequestException() {
        int versionNumber = 1;
        ModelVersion mv = new ModelVersion(model, versionNumber, "test_path.pkl");
        mv.setId(UUID.randomUUID());
        mv.setIsActive(true); // Is active

        when(modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)).thenReturn(Optional.of(mv));

        assertThrows(BadRequestException.class, () -> modelService.deleteModelVersion(modelId, versionNumber));
        verify(modelStorageUtil, never()).deleteModelFile(anyString());
        verify(modelVersionRepository, never()).delete(any(ModelVersion.class));
    }
}