package com.mlutil.controller;

import com.mlutil.dto.ModelDto;
import com.mlutil.dto.ModelVersionDto;
import com.mlutil.service.ModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/models")
@RequiredArgsConstructor
@Tag(name = "Model Management", description = "API for managing Machine Learning Models and their versions")
public class ModelController {

    private final ModelService modelService;

    @Operation(summary = "Get all registered models")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list of models",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ModelDto.class))))
    @GetMapping
    public ResponseEntity<List<ModelDto>> getAllModels() {
        List<ModelDto> models = modelService.getAllModels();
        return ResponseEntity.ok(models);
    }

    @Operation(summary = "Get a model by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved model",
                    content = @Content(schema = @Schema(implementation = ModelDto.class))),
            @ApiResponse(responseCode = "404", description = "Model not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ModelDto> getModelById(@PathVariable UUID id) {
        ModelDto model = modelService.getModelById(id);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Create a new model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Model created successfully",
                    content = @Content(schema = @Schema(implementation = ModelDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid model data or name already exists")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ModelDto> createModel(@Valid @RequestBody ModelDto modelDto) {
        ModelDto createdModel = modelService.createModel(modelDto);
        return new ResponseEntity<>(createdModel, HttpStatus.CREATED);
    }

    @Operation(summary = "Update an existing model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Model updated successfully",
                    content = @Content(schema = @Schema(implementation = ModelDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid model data or name already exists"),
            @ApiResponse(responseCode = "404", description = "Model not found")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ModelDto> updateModel(@PathVariable UUID id, @Valid @RequestBody ModelDto modelDto) {
        ModelDto updatedModel = modelService.updateModel(id, modelDto);
        return ResponseEntity.ok(updatedModel);
    }

    @Operation(summary = "Delete a model by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Model deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Model not found")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteModel(@PathVariable UUID id) {
        modelService.deleteModel(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Upload a new version of a model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Model version uploaded successfully",
                    content = @Content(schema = @Schema(implementation = ModelVersionDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid file or model not found"),
            @ApiResponse(responseCode = "404", description = "Model not found")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/{modelId}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ModelVersionDto> uploadModelVersion(
            @PathVariable UUID modelId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) Double accuracy,
            @RequestParam(required = false) Double precision,
            @RequestParam(required = false) Double recall,
            @RequestParam(required = false) Double f1Score) {
        ModelVersionDto newVersion = modelService.uploadModelVersion(modelId, file, accuracy, precision, recall, f1Score);
        return new ResponseEntity<>(newVersion, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a specific version of a model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved model version",
                    content = @Content(schema = @Schema(implementation = ModelVersionDto.class))),
            @ApiResponse(responseCode = "404", description = "Model or version not found")
    })
    @GetMapping("/{modelId}/versions/{versionNumber}")
    public ResponseEntity<ModelVersionDto> getModelVersion(@PathVariable UUID modelId, @PathVariable Integer versionNumber) {
        ModelVersionDto modelVersion = modelService.getModelVersion(modelId, versionNumber);
        return ResponseEntity.ok(modelVersion);
    }

    @Operation(summary = "Get the currently active version of a model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved active model version",
                    content = @Content(schema = @Schema(implementation = ModelVersionDto.class))),
            @ApiResponse(responseCode = "404", description = "Active model version not found")
    })
    @GetMapping("/{modelId}/versions/active")
    public ResponseEntity<ModelVersionDto> getActiveModelVersion(@PathVariable UUID modelId) {
        ModelVersionDto modelVersion = modelService.getActiveModelVersion(modelId);
        return ResponseEntity.ok(modelVersion);
    }

    @Operation(summary = "Set a specific model version as active for inference")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Model version activated successfully",
                    content = @Content(schema = @Schema(implementation = ModelVersionDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "404", description = "Model or version not found")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{modelId}/versions/{versionNumber}/activate")
    public ResponseEntity<ModelVersionDto> activateModelVersion(@PathVariable UUID modelId, @PathVariable Integer versionNumber) {
        ModelVersionDto activatedVersion = modelService.activateModelVersion(modelId, versionNumber);
        return ResponseEntity.ok(activatedVersion);
    }

    @Operation(summary = "Delete a specific version of a model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Model version deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot delete an active version"),
            @ApiResponse(responseCode = "404", description = "Model or version not found")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{modelId}/versions/{versionNumber}")
    public ResponseEntity<Void> deleteModelVersion(@PathVariable UUID modelId, @PathVariable Integer versionNumber) {
        modelService.deleteModelVersion(modelId, versionNumber);
        return ResponseEntity.noContent().build();
    }
}