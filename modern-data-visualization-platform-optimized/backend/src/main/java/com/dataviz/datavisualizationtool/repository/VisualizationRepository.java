package com.dataviz.datavisualizationtool.repository;

import com.dataviz.datavisualizationtool.entity.Visualization;
import com.dataviz.datavisualizationtool.entity.Dashboard;
import com.dataviz.datavisualizationtool.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisualizationRepository extends JpaRepository<Visualization, Long> {
    List<Visualization> findByDashboard(Dashboard dashboard);
    List<Visualization> findByOwner(User owner);
}