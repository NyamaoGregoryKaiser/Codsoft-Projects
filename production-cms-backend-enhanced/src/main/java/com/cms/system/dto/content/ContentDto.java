package com.cms.system.dto.content;

import com.cms.system.dto.category.CategoryDto;
import com.cms.system.dto.user.UserDto;
import com.cms.system.model.Content;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ContentDto {
    private Long id;
    private String title;
    private String body;
    private String slug;
    private Content.ContentStatus status;
    private CategoryDto category;
    private UserDto author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}