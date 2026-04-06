package com.cms.system.dto.content;

import com.cms.system.model.Content;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContentUpdateRequest {
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    private String body;
    private String slug;
    private Long categoryId;
    private Content.ContentStatus status;
}