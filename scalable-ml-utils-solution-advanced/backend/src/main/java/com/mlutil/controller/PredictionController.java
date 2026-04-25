package com.mlutil.controller;

import com.mlutil.dto.PredictionRequest;
import com.mlutil.dto.PredictionResponse;
import com.mlutil.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/predictions")
@RequiredArgsConstructor
@Tag(name = "Prediction Service", description = "API for performing predictions using deployed ML models")
public class PredictionController {

    private final PredictionService predictionService;

    @Operation(summary = "Perform a prediction using a specified model or its active version")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Prediction successful",
                    content = @Content(schema = @Schema(implementation = PredictionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid prediction request or model not ready"),
            @ApiResponse(responseCode = "404", description = "Model or version not found"),
            @ApiResponse(responseCode = "429", description = "Too many requests (rate limited)")
    })
    @PostMapping
    public ResponseEntity<PredictionResponse> predict(@Valid @RequestBody PredictionRequest request) {
        PredictionResponse response = predictionService.predict(request);
        return ResponseEntity.ok(response);
    }
}