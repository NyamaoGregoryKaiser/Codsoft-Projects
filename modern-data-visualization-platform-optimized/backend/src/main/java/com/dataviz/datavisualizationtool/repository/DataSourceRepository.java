package com.dataviz.datavisualizationtool.repository;

import com.dataviz.datavisualizationtool.entity.DataSource;
import com.dataviz.datavisualizationtool.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataSourceRepository extends JpaRepository<DataSource, Long> {
    List<DataSource> findByOwner(User owner);
}