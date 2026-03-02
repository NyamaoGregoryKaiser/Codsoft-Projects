```java
package com.mlutil.predictionservice.controller;

import com.mlutil.predictionservice.dto.PredictionRequest;
import com.mlutil.predictionservice.dto.PredictionResponse;
import com.mlutil.predictionservice.entity.PredictionLog;
import com.mlutil.predictionservice.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@Tag(name = "Prediction Service", description = "API for serving predictions from ML models and logging results")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @Operation(summary = "Make a prediction using the active version of a specified model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Prediction successful"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "404", description = "Model not found or no active version"),
            @ApiResponse(responseCode = "429", description = "Too many requests (rate limit exceeded)")
    })
    @PostMapping("/{modelId}")
    public ResponseEntity<PredictionResponse> predict(@Parameter(description = "ID of the model to use for prediction") @PathVariable Long modelId,
                                                      @Valid @RequestBody PredictionRequest request,
                                                      @AuthenticationPrincipal(expression = "username") String username,
                                                      HttpServletRequest httpServletRequest) {
        // Username can be null if not authenticated (permitAll for predictions)
        PredictionResponse response = predictionService.makePrediction(modelId, request, username, httpServletRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Operation(summary = "Get a specific prediction log entry by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved prediction log"),
            @ApiResponse(responseCode = "404", description = "Prediction log not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @SecurityRequirement(name = "BearerAuth")
    @GetMapping("/logs/{logId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PredictionLog> getPredictionLogById(@Parameter(description = "ID of the prediction log entry") @PathVariable Long logId) {
        PredictionLog log = predictionService.getPredictionLogById(logId);
        return ResponseEntity.ok(log);
    }

    @Operation(summary = "Get all prediction logs for a specific model")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved prediction logs"),
            @ApiResponse(responseCode = "404", description = "Model not found or no logs exist"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @SecurityRequirement(name = "BearerAuth")
    @GetMapping("/logs/model/{modelId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PredictionLog>> getPredictionLogsForModel(@Parameter(description = "ID of the model") @PathVariable Long modelId) {
        List<PredictionLog> logs = predictionService.getPredictionLogsForModel(modelId);
        return ResponseEntity.ok(logs);
    }
}
```