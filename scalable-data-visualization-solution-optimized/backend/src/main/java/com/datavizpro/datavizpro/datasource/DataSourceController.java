package com.datavizpro.datavizpro.datasource;

import com.datavizpro.datavizpro.shared.dtos.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sources")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth") // For Swagger UI
@Tag(name = "Data Sources", description = "API for managing data sources")
public class DataSourceController {

    private final DataSourceService dataSourceService;

    @Operation(summary = "Create a new data source")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<ApiResponse<DataSourceDto>> createDataSource(@Valid @RequestBody DataSourceCreateUpdateDto dto, @AuthenticationPrincipal UserDetails currentUser) {
        DataSourceDto createdDataSource = dataSourceService.createDataSource(dto, currentUser.getUsername());
        return new ResponseEntity<>(ApiResponse.success("Data source created successfully", createdDataSource), HttpStatus.CREATED);
    }

    @Operation(summary = "Get all data sources for the current user (or all if ADMIN)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER') or hasRole('VIEWER')")
    public ResponseEntity<ApiResponse<List<DataSourceDto>>> getAllDataSources(@AuthenticationPrincipal UserDetails currentUser) {
        List<DataSourceDto> dataSources = dataSourceService.getAllDataSourcesForUser(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Data sources retrieved successfully", dataSources));
    }

    @Operation(summary = "Get a data source by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @dataSourceService.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<DataSourceDto>> getDataSourceById(@PathVariable Long id) {
        DataSourceDto dataSource = dataSourceService.getDataSourceById(id);
        return ResponseEntity.ok(ApiResponse.success("Data source retrieved successfully", dataSource));
    }

    @Operation(summary = "Update an existing data source")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @dataSourceService.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<DataSourceDto>> updateDataSource(@PathVariable Long id, @Valid @RequestBody DataSourceCreateUpdateDto dto) {
        DataSourceDto updatedDataSource = dataSourceService.updateDataSource(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Data source updated successfully", updatedDataSource));
    }

    @Operation(summary = "Delete a data source by ID")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @dataSourceService.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<Void>> deleteDataSource(@PathVariable Long id) {
        dataSourceService.deleteDataSource(id);
        return ResponseEntity.ok(ApiResponse.success("Data source deleted successfully"));
    }

    @Operation(summary = "Test connection to a data source")
    @PostMapping("/test-connection")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> testDataSourceConnection(@Valid @RequestBody DataSourceCreateUpdateDto dto) {
        // In a real scenario, this would involve connecting and executing a simple query
        boolean success = dataSourceService.testConnection(dto);
        if (success) {
            return ResponseEntity.ok(ApiResponse.success("Connection successful", "Connection to data source established."));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Connection failed", "Could not connect to data source with provided details."));
        }
    }
}