package com.mlutil.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ModelDto {
    private UUID id;

    @NotBlank(message = "Model name cannot be empty")
    private String name;

    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<ModelVersionDto> versions;

    // For create operations, id, createdAt, updatedAt, versions will be null
}