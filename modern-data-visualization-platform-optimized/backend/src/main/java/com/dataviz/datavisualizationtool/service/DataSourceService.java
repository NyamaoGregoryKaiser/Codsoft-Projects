package com.dataviz.datavisualizationtool.service;

import com.dataviz.datavisualizationtool.config.CacheConfig;
import com.dataviz.datavisualizationtool.dto.DataSourceDTO;
import com.dataviz.datavisualizationtool.entity.DataSource;
import com.dataviz.datavisualizationtool.entity.User;
import com.dataviz.datavisualizationtool.exception.ResourceNotFoundException;
import com.dataviz.datavisualizationtool.repository.DataSourceRepository;
import com.dataviz.datavisualizationtool.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DataSourceService {

    @Autowired
    private DataSourceRepository dataSourceRepository;

    @Autowired
    private UserRepository userRepository; // To fetch user for owner_id

    @Cacheable(value = CacheConfig.DATA_SOURCE_CACHE, key = "#id")
    public DataSourceDTO getDataSourceById(Long id) {
        DataSource dataSource = dataSourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataSource not found with id: " + id));
        return convertToDTO(dataSource);
    }

    public List<DataSourceDTO> getAllDataSources() {
        return dataSourceRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DataSourceDTO> getDataSourcesByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));
        return dataSourceRepository.findByOwner(owner).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = CacheConfig.DATA_SOURCE_CACHE, allEntries = true) // Clear cache on new creation
    public DataSourceDTO createDataSource(DataSourceDTO dataSourceDTO) {
        User owner = userRepository.findById(dataSourceDTO.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + dataSourceDTO.getOwnerId()));

        DataSource dataSource = new DataSource();
        dataSource.setName(dataSourceDTO.getName());
        dataSource.setType(dataSourceDTO.getType());
        dataSource.setConnectionDetails(dataSourceDTO.getConnectionDetails());
        dataSource.setOwner(owner);

        DataSource savedDataSource = dataSourceRepository.save(dataSource);
        return convertToDTO(savedDataSource);
    }

    @Transactional
    @CachePut(value = CacheConfig.DATA_SOURCE_CACHE, key = "#id")
    @CacheEvict(value = CacheConfig.DATA_SOURCE_CACHE, allEntries = true, condition = "#result == null") // Clear all if update fails or not found
    public DataSourceDTO updateDataSource(Long id, DataSourceDTO dataSourceDTO) {
        DataSource existingDataSource = dataSourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataSource not found with id: " + id));

        existingDataSource.setName(dataSourceDTO.getName());
        existingDataSource.setType(dataSourceDTO.getType());
        existingDataSource.setConnectionDetails(dataSourceDTO.getConnectionDetails());

        // Optionally update owner, but often not allowed
        if (dataSourceDTO.getOwnerId() != null && !existingDataSource.getOwner().getId().equals(dataSourceDTO.getOwnerId())) {
             User newOwner = userRepository.findById(dataSourceDTO.getOwnerId())
                     .orElseThrow(() -> new ResourceNotFoundException("New owner not found with id: " + dataSourceDTO.getOwnerId()));
             existingDataSource.setOwner(newOwner);
        }

        DataSource updatedDataSource = dataSourceRepository.save(existingDataSource);
        return convertToDTO(updatedDataSource);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.DATA_SOURCE_CACHE, key = "#id")
    public void deleteDataSource(Long id) {
        if (!dataSourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("DataSource not found with id: " + id);
        }
        dataSourceRepository.deleteById(id);
    }

    private DataSourceDTO convertToDTO(DataSource dataSource) {
        DataSourceDTO dto = new DataSourceDTO();
        dto.setId(dataSource.getId());
        dto.setName(dataSource.getName());
        dto.setType(dataSource.getType());
        dto.setConnectionDetails(dataSource.getConnectionDetails());
        dto.setOwnerId(dataSource.getOwner().getId());
        dto.setOwnerUsername(dataSource.getOwner().getUsername());
        dto.setCreatedAt(dataSource.getCreatedAt());
        dto.setUpdatedAt(dataSource.getUpdatedAt());
        return dto;
    }

    // This could be made into a generic mapper component
    public DataSource convertToEntity(DataSourceDTO dataSourceDTO) {
        User owner = userRepository.findById(dataSourceDTO.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with id: " + dataSourceDTO.getOwnerId()));

        return DataSource.builder()
                .id(dataSourceDTO.getId())
                .name(dataSourceDTO.getName())
                .type(dataSourceDTO.getType())
                .connectionDetails(dataSourceDTO.getConnectionDetails())
                .owner(owner)
                .createdAt(dataSourceDTO.getCreatedAt())
                .updatedAt(dataSourceDTO.getUpdatedAt())
                .build();
    }
}