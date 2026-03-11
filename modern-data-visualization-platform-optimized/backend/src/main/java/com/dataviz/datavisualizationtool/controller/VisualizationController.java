package com.dataviz.datavisualizationtool.controller;

import com.dataviz.datavisualizationtool.dto.DataQueryResponse;
import com.dataviz.datavisualizationtool.dto.VisualizationDTO;
import com.dataviz.datavisualizationtool.security.services.UserDetailsImpl;
import com.dataviz.datavisualizationtool.service.VisualizationService;
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
@RequestMapping("/api/visualizations")
public class VisualizationController {

    @Autowired
    private VisualizationService visualizationService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<VisualizationDTO>> getAllVisualizations(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        // In a real scenario, you would filter based on dashboard access or explicit visualization sharing
        // For simplicity, returning all visualizations owned by the current user.
        List<VisualizationDTO> visualizations = visualizationService.getVisualizationsByOwner(userDetails.getId());
        return ResponseEntity.ok(visualizations);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<VisualizationDTO> getVisualizationById(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        VisualizationDTO visualization = visualizationService.getVisualizationById(id);
        // Authorization check
        if (!visualization.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(visualization);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<VisualizationDTO> createVisualization(@Valid @RequestBody VisualizationDTO visualizationDTO,
                                                              @AuthenticationPrincipal UserDetailsImpl userDetails) {
        visualizationDTO.setOwnerId(userDetails.getId()); // Set owner to current user
        VisualizationDTO createdVisualization = visualizationService.createVisualization(visualizationDTO);
        return new ResponseEntity<>(createdVisualization, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<VisualizationDTO> updateVisualization(@PathVariable Long id,
                                                              @Valid @RequestBody VisualizationDTO visualizationDTO,
                                                              @AuthenticationPrincipal UserDetailsImpl userDetails) {
        VisualizationDTO existingVisualization = visualizationService.getVisualizationById(id);
        if (!existingVisualization.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        visualizationDTO.setOwnerId(existingVisualization.getOwnerId()); // Prevent changing owner
        VisualizationDTO updatedVisualization = visualizationService.updateVisualization(id, visualizationDTO);
        return ResponseEntity.ok(updatedVisualization);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVisualization(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        VisualizationDTO existingVisualization = visualizationService.getVisualizationById(id);
        if (!existingVisualization.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        visualizationService.deleteVisualization(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/data")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DataQueryResponse> getVisualizationData(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Authorization check on the visualization itself, as done in getVisualizationById
        // The service layer handles internal auth for data source access indirectly.
        VisualizationDTO visualization = visualizationService.getVisualizationById(id);
        if (!visualization.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        DataQueryResponse data = visualizationService.fetchDataForVisualization(id);
        return ResponseEntity.ok(data);
    }
}