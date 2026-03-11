package com.dataviz.datavisualizationtool.controller;

import com.dataviz.datavisualizationtool.dto.DashboardDTO;
import com.dataviz.datavisualizationtool.security.services.UserDetailsImpl;
import com.dataviz.datavisualizationtool.service.DashboardService;
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
@RequestMapping("/api/dashboards")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<DashboardDTO>> getAllDashboards(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Return dashboards owned by the current user
        List<DashboardDTO> dashboards = dashboardService.getDashboardsByOwner(userDetails.getId());
        return ResponseEntity.ok(dashboards);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DashboardDTO> getDashboardById(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        DashboardDTO dashboard = dashboardService.getDashboardById(id);
        // Authorization check
        if (!dashboard.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(dashboard);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DashboardDTO> createDashboard(@Valid @RequestBody DashboardDTO dashboardDTO,
                                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        dashboardDTO.setOwnerId(userDetails.getId()); // Set owner to current user
        DashboardDTO createdDashboard = dashboardService.createDashboard(dashboardDTO);
        return new ResponseEntity<>(createdDashboard, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<DashboardDTO> updateDashboard(@PathVariable Long id,
                                                        @Valid @RequestBody DashboardDTO dashboardDTO,
                                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        DashboardDTO existingDashboard = dashboardService.getDashboardById(id);
        if (!existingDashboard.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        dashboardDTO.setOwnerId(existingDashboard.getOwnerId()); // Prevent changing owner through update
        DashboardDTO updatedDashboard = dashboardService.updateDashboard(id, dashboardDTO);
        return ResponseEntity.ok(updatedDashboard);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDashboard(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        DashboardDTO existingDashboard = dashboardService.getDashboardById(id);
        if (!existingDashboard.getOwnerId().equals(userDetails.getId()) && !userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        dashboardService.deleteDashboard(id);
        return ResponseEntity.noContent().build();
    }
}