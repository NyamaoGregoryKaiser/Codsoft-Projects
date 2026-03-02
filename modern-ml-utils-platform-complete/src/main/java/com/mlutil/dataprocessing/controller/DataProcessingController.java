```java
package com.mlutil.dataprocessing.controller;

import com.mlutil.dataprocessing.dto.DataProcessingRequest;
import com.mlutil.dataprocessing.dto.DataProcessingResponse;
import com.mlutil.dataprocessing.service.DataProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data-processing")
@Tag(name = "Data Processing", description = "API for common ML data preprocessing utilities")
@SecurityRequirement(name = "BearerAuth")
public class DataProcessingController {

    private final DataProcessingService dataProcessingService;

    public DataProcessingController(DataProcessingService dataProcessingService) {
        this.dataProcessingService = dataProcessingService;
    }

    @Operation(summary = "Apply a specified data processing transformation to input data")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Data processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or unsupported processing type"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping("/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Even regular users might need this for preparing data for prediction
    public ResponseEntity<DataProcessingResponse> processData(@Valid @RequestBody DataProcessingRequest request) {
        DataProcessingResponse response = dataProcessingService.processData(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
```