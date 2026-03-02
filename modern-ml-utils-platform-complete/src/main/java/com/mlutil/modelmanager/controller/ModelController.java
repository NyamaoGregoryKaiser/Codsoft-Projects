```java
package com.mlutil.modelmanager.controller;

import com.mlutil.modelmanager.dto.ModelDto;
import com.mlutil.modelmanager.dto.ModelRegisterRequest;
import com.mlutil.modelmanager.dto.ModelVersionDto;
import com.mlutil.modelmanager.dto.ModelVersionUploadRequest;
import com.mlutil.modelmanager.service.ModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/models")
@Tag(name = "Model Management", description = "API for managing ML models and their versions")
@SecurityRequirement(name = "BearerAuth") // Applies JWT security to all endpoints in this controller
public class ModelController {

    private final ModelService modelService;

    public ModelController(ModelService modelService) {
        this.modelService = modelService;
    }

    @Operation(summary = "Register a new ML model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Model registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModelDto> registerModel(@Valid @RequestBody ModelRegisterRequest request,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        ModelDto registeredModel = modelService.registerModel(request, userDetails.getUsername());
        return new ResponseEntity<>(registeredModel, HttpStatus.CREATED);
    }

    @Operation(summary = "Get all registered models with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved models"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Page<ModelDto>> getAllModels(@PageableDefault(size = 10) Pageable pageable) {
        Page<ModelDto> models = modelService.getAllModels(pageable);
        return ResponseEntity.ok(models);
    }

    @Operation(summary = "Get a model by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved model"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ModelDto> getModelById(@Parameter(description = "ID of the model to retrieve") @PathVariable Long id) {
        ModelDto model = modelService.getModelById(id);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Update an existing model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Model updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModelDto> updateModel(@Parameter(description = "ID of the model to update") @PathVariable Long id,
                                                @Valid @RequestBody ModelRegisterRequest request) {
        ModelDto updatedModel = modelService.updateModel(id, request);
        return ResponseEntity.ok(updatedModel);
    }

    @Operation(summary = "Delete a model by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Model deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteModel(@Parameter(description = "ID of the model to delete") @PathVariable Long id) {
        modelService.deleteModel(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Upload a new version for an existing ML model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Model version uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping("/{modelId}/versions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModelVersionDto> uploadModelVersion(@Parameter(description = "ID of the model to add version to") @PathVariable Long modelId,
                                                              @Valid @RequestBody ModelVersionUploadRequest request) {
        ModelVersionDto uploadedVersion = modelService.uploadModelVersion(modelId, request);
        return new ResponseEntity<>(uploadedVersion, HttpStatus.CREATED);
    }

    @Operation(summary = "Get all versions for a specific model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved model versions"),
            @ApiResponse(responseCode = "404", description = "Model not found or no versions exist"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/{modelId}/versions")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ModelVersionDto>> getModelVersions(@Parameter(description = "ID of the model") @PathVariable Long modelId) {
        List<ModelVersionDto> versions = modelService.getModelVersions(modelId);
        return ResponseEntity.ok(versions);
    }

    @Operation(summary = "Get a specific model version by model ID and version number")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved model version"),
            @ApiResponse(responseCode = "404", description = "Model version not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/{modelId}/versions/{versionNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ModelVersionDto> getModelVersionByNumber(@Parameter(description = "ID of the model") @PathVariable Long modelId,
                                                                   @Parameter(description = "Version number of the model") @PathVariable Integer versionNumber) {
        ModelVersionDto version = modelService.getModelVersionByIdAndNumber(modelId, versionNumber);
        return ResponseEntity.ok(version);
    }

    @Operation(summary = "Activate a specific model version for deployment/inference")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Model version activated successfully"),
            @ApiResponse(responseCode = "404", description = "Model or version not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PutMapping("/{modelId}/versions/{versionNumber}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModelVersionDto> activateModelVersion(@Parameter(description = "ID of the model") @PathVariable Long modelId,
                                                                @Parameter(description = "Version number to activate") @PathVariable Integer versionNumber) {
        ModelVersionDto activatedVersion = modelService.activateModelVersion(modelId, versionNumber);
        return ResponseEntity.ok(activatedVersion);
    }

    @Operation(summary = "Get the currently active model version for a given model ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved active model version"),
            @ApiResponse(responseCode = "404", description = "Active version not found for model"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/{modelId}/versions/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ModelVersionDto> getActiveModelVersion(@Parameter(description = "ID of the model") @PathVariable Long modelId) {
        ModelVersionDto activeVersion = modelService.getActiveModelVersion(modelId);
        return ResponseEntity.ok(activeVersion);
    }
}
```