package com.cms.system.dto.content;

import com.cms.system.model.Content;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContentCreateRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    @NotBlank(message = "Content body is required")
    private String body;

    private String slug;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Content.ContentStatus status = Content.ContentStatus.DRAFT;
}