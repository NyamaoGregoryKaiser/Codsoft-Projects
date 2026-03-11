package com.dataviz.datavisualizationtool.service;

import com.dataviz.datavisualizationtool.config.CacheConfig;
import com.dataviz.datavisualizationtool.config.RateLimitingConfig;
import com.dataviz.datavisualizationtool.dto.DataQueryResponse;
import com.dataviz.datavisualizationtool.dto.VisualizationDTO;
import com.dataviz.datavisualizationtool.entity.Dashboard;
import com.dataviz.datavisualizationtool.entity.DataSource;
import com.dataviz.datavisualizationtool.entity.User;
import com.dataviz.datavisualizationtool.entity.Visualization;
import com.dataviz.datavisualizationtool.exception.BadRequestException;
import com.dataviz.datavisualizationtool.exception.ResourceNotFoundException;
import com.dataviz.datavisualizationtool.repository.DashboardRepository;
import com.dataviz.datavisualizationtool.repository.DataSourceRepository;
import com.dataviz.datavisualizationtool.repository.UserRepository;
import com.dataviz.datavisualizationtool.repository.VisualizationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource as SqlDataSource;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VisualizationService {

    @Autowired
    private VisualizationRepository visualizationRepository;

    @Autowired
    private DataSourceRepository dataSourceRepository;

    @Autowired
    private DashboardRepository dashboardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RateLimiter dataFetchRateLimiter; // Injected specific rate limiter

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable(value = CacheConfig.VISUALIZATION_CACHE, key = "#id")
    public VisualizationDTO getVisualizationById(Long id) {
        Visualization visualization = visualizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visualization not found with id: " + id));
        return convertToDTO(visualization);
    }

    public List<VisualizationDTO> getAllVisualizations() {
        return visualizationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<VisualizationDTO> getVisualizationsByDashboard(Long dashboardId) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard not found with id: " + dashboardId));
        return visualizationRepository.findByDashboard(dashboard).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<VisualizationDTO> getVisualizationsByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));
        return visualizationRepository.findByOwner(owner).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = CacheConfig.VISUALIZATION_CACHE, allEntries = true)
    public VisualizationDTO createVisualization(VisualizationDTO visualizationDTO) {
        DataSource dataSource = dataSourceRepository.findById(visualizationDTO.getDataSourceId())
                .orElseThrow(() -> new ResourceNotFoundException("DataSource not found with id: " + visualizationDTO.getDataSourceId()));
        Dashboard dashboard = dashboardRepository.findById(visualizationDTO.getDashboardId())
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard not found with id: " + visualizationDTO.getDashboardId()));
        User owner = userRepository.findById(visualizationDTO.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + visualizationDTO.getOwnerId()));

        Visualization visualization = new Visualization();
        visualization.setTitle(visualizationDTO.getTitle());
        visualization.setDescription(visualizationDTO.getDescription());
        visualization.setType(visualizationDTO.getType());
        visualization.setDataSource(dataSource);
        visualization.setQuery(visualizationDTO.getQuery());
        visualization.setConfig(visualizationDTO.getConfig());
        visualization.setPosition(visualizationDTO.getPosition());
        visualization.setSizeX(visualizationDTO.getSizeX());
        visualization.setSizeY(visualizationDTO.getSizeY());
        visualization.setDashboard(dashboard);
        visualization.setOwner(owner);

        Visualization savedVisualization = visualizationRepository.save(visualization);
        return convertToDTO(savedVisualization);
    }

    @Transactional
    @CachePut(value = CacheConfig.VISUALIZATION_CACHE, key = "#id")
    @CacheEvict(value = CacheConfig.VISUALIZATION_CACHE, allEntries = true, condition = "#result == null")
    public VisualizationDTO updateVisualization(Long id, VisualizationDTO visualizationDTO) {
        Visualization existingVisualization = visualizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visualization not found with id: " + id));

        DataSource dataSource = dataSourceRepository.findById(visualizationDTO.getDataSourceId())
                .orElseThrow(() -> new ResourceNotFoundException("DataSource not found with id: " + visualizationDTO.getDataSourceId()));
        Dashboard dashboard = dashboardRepository.findById(visualizationDTO.getDashboardId())
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard not found with id: " + visualizationDTO.getDashboardId()));
        User owner = userRepository.findById(visualizationDTO.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + visualizationDTO.getOwnerId()));


        existingVisualization.setTitle(visualizationDTO.getTitle());
        existingVisualization.setDescription(visualizationDTO.getDescription());
        existingVisualization.setType(visualizationDTO.getType());
        existingVisualization.setDataSource(dataSource);
        existingVisualization.setQuery(visualizationDTO.getQuery());
        existingVisualization.setConfig(visualizationDTO.getConfig());
        existingVisualization.setPosition(visualizationDTO.getPosition());
        existingVisualization.setSizeX(visualizationDTO.getSizeX());
        existingVisualization.setSizeY(visualizationDTO.getSizeY());
        existingVisualization.setDashboard(dashboard);
        existingVisualization.setOwner(owner);

        Visualization updatedVisualization = visualizationRepository.save(existingVisualization);
        return convertToDTO(updatedVisualization);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.VISUALIZATION_CACHE, key = "#id")
    public void deleteVisualization(Long id) {
        if (!visualizationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Visualization not found with id: " + id);
        }
        visualizationRepository.deleteById(id);
    }

    @Cacheable(value = "visualizationData", key = "#visualizationId") // Cache query results
    public DataQueryResponse fetchDataForVisualization(Long visualizationId) {
        Visualization visualization = visualizationRepository.findById(visualizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Visualization not found with id: " + visualizationId));

        DataSource dataSource = visualization.getDataSource();
        String query = visualization.getQuery();

        // Apply rate limiting before executing the data query
        try {
            RateLimiter.waitForPermission(dataFetchRateLimiter); // Blocks if rate limit exceeded
        } catch (RequestNotPermitted e) {
            return new DataQueryResponse(Collections.emptyList(), "Rate limit exceeded. Please try again later.", false);
        }

        switch (dataSource.getType().toUpperCase()) {
            case "POSTGRES":
            case "MYSQL":
            case "H2":
                return executeSqlQuery(dataSource, query);
            case "REST_API":
                return fetchFromRestApi(dataSource, query);
            case "CSV":
                // For a real app, this would involve reading/parsing a CSV file
                return new DataQueryResponse(List.of(
                        Map.of("category", "A", "value", 10),
                        Map.of("category", "B", "value", 20),
                        Map.of("category", "C", "value", 15)
                ), "Data fetched from mock CSV.", true);
            default:
                throw new BadRequestException("Unsupported data source type: " + dataSource.getType());
        }
    }

    private DataQueryResponse executeSqlQuery(DataSource dataSource, String query) {
        try {
            Map<String, String> connDetails = objectMapper.readValue(dataSource.getConnectionDetails(), new TypeReference<>() {});

            DriverManagerDataSource dmds = new DriverManagerDataSource();
            dmds.setDriverClassName(getDriverClassName(dataSource.getType()));
            dmds.setUrl(connDetails.get("url"));
            dmds.setUsername(connDetails.get("username"));
            dmds.setPassword(connDetails.get("password"));

            JdbcTemplate jdbcTemplate = new JdbcTemplate(dmds);

            List<Map<String, Object>> results = jdbcTemplate.queryForList(query);
            return new DataQueryResponse(results, "SQL query executed successfully.", true);

        } catch (SQLException e) {
            throw new BadRequestException("Database connection error: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new BadRequestException("Error executing SQL query: " + e.getMessage(), e);
        }
    }

    private String getDriverClassName(String dbType) {
        return switch (dbType.toUpperCase()) {
            case "POSTGRES" -> "org.postgresql.Driver";
            case "MYSQL" -> "com.mysql.cj.jdbc.Driver";
            case "H2" -> "org.h2.Driver";
            default -> throw new IllegalArgumentException("Unsupported database type for driver: " + dbType);
        };
    }

    private DataQueryResponse fetchFromRestApi(DataSource dataSource, String path) {
        // In a real application, you would use Spring WebClient or RestTemplate
        // to make an actual HTTP call to the external REST API based on dataSource.connectionDetails and path.
        // For demonstration, we'll return mock data.
        return new DataQueryResponse(List.of(
                Map.of("time", "2023-01-01", "temp", 25.5),
                Map.of("time", "2023-01-02", "temp", 26.1),
                Map.of("time", "2023-01-03", "temp", 24.9)
        ), "Data fetched from mock REST API.", true);
    }

    public VisualizationDTO convertToDTO(Visualization visualization) {
        VisualizationDTO dto = new VisualizationDTO();
        dto.setId(visualization.getId());
        dto.setTitle(visualization.getTitle());
        dto.setDescription(visualization.getDescription());
        dto.setType(visualization.getType());
        dto.setDataSourceId(visualization.getDataSource().getId());
        dto.setDataSourceName(visualization.getDataSource().getName());
        dto.setQuery(visualization.getQuery());
        dto.setConfig(visualization.getConfig());
        dto.setPosition(visualization.getPosition());
        dto.setSizeX(visualization.getSizeX());
        dto.setSizeY(visualization.getSizeY());
        dto.setDashboardId(visualization.getDashboard().getId());
        dto.setOwnerId(visualization.getOwner().getId());
        dto.setOwnerUsername(visualization.getOwner().getUsername());
        dto.setCreatedAt(visualization.getCreatedAt());
        dto.setUpdatedAt(visualization.getUpdatedAt());
        return dto;
    }

    public Visualization convertToEntity(VisualizationDTO dto) {
        DataSource dataSource = dataSourceRepository.findById(dto.getDataSourceId())
                .orElseThrow(() -> new ResourceNotFoundException("DataSource not found with id: " + dto.getDataSourceId()));
        Dashboard dashboard = dashboardRepository.findById(dto.getDashboardId())
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard not found with id: " + dto.getDashboardId()));
        User owner = userRepository.findById(dto.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + dto.getOwnerId()));

        return Visualization.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .dataSource(dataSource)
                .query(dto.getQuery())
                .config(dto.getConfig())
                .position(dto.getPosition())
                .sizeX(dto.getSizeX())
                .sizeY(dto.getSizeY())
                .dashboard(dashboard)
                .owner(owner)
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}