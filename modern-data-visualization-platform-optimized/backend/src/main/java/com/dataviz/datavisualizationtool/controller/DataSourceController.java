package com.dataviz.datavisualizationtool.controller;

import com.dataviz.datavisualizationtool.dto.DataSourceDTO;
import com.dataviz.datavisualizationtool.security.services.UserDetailsImpl;
import com.dataviz.datavisualizationtool.service.DataSourceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/data-sources")
public class DataSourceController {

    @Autowired
    private DataSourceService dataSourceService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<DataSourceDTO>> getAllDataSources(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        // In a real scenario, you might want to filter by user's organization or shared access
        // For now, let's return all accessible to the user (e.g. owned by user).
        List<DataSourceDTO> dataSources = dataSourceService.getDataSourcesByOwner(userDetails.getId());
        return ResponseEntity.ok(dataSources);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DataSourceDTO> getDataSourceById(@PathVariable Long id) {
        DataSourceDTO dataSource = dataSourceService.getDataSourceById(id);
        // Add authorization check: userDetails.getId() == dataSource.getOwnerId() or has ADMIN/MOD role
        return ResponseEntity.ok(dataSource);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DataSourceDTO> createDataSource(@Valid @RequestBody DataSourceDTO dataSourceDTO,
                                                          @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Ensure the owner of the data source is the currently authenticated user
        dataSourceDTO.setOwnerId(userDetails.getId());
        DataSourceDTO createdDataSource = dataSourceService.createDataSource(dataSourceDTO);
        return new ResponseEntity<>(createdDataSource, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DataSourceDTO> updateDataSource(@PathVariable Long id,
                                                          @Valid @RequestBody DataSourceDTO dataSourceDTO,
                                                          @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Add authorization check: userDetails.getId() == existingDataSource.getOwnerId() or has ADMIN role
        DataSourceDTO existingDataSource = dataSourceService.getDataSourceById(id);
        if (!existingDataSource.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        // Ensure owner cannot be changed by non-admin or unauthorized user
        dataSourceDTO.setOwnerId(existingDataSource.getOwnerId());
        DataSourceDTO updatedDataSource = dataSourceService.updateDataSource(id, dataSourceDTO);
        return ResponseEntity.ok(updatedDataSource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDataSource(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        DataSourceDTO existingDataSource = dataSourceService.getDataSourceById(id);
        if (!existingDataSource.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        dataSourceService.deleteDataSource(id);
        return ResponseEntity.noContent().build();
    }
}