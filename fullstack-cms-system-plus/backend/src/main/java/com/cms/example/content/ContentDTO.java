```java
package com.cms.example.content;

import com.cms.example.category.CategoryDTO;
import com.cms.example.user.Role;
import com.cms.example.user.User;
import com.cms.example.user.UserService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentDTO {
    private Long id;
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;
    private String slug;
    @NotBlank(message = "Content body is required")
    private String body;
    private String featuredImage;
    private ContentStatus status;
    private ContentType type;
    private Long authorId; // In DTO, we use ID for relationships
    private String authorName; // For display purposes
    private Long categoryId;
    private String categoryName; // For display purposes
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private LocalDateTime updatedAt;

    // Helper to convert Content entity to DTO
    public static ContentDTO fromEntity(Content content) {
        return ContentDTO.builder()
                .id(content.getId())
                .title(content.getTitle())
                .slug(content.getSlug())
                .body(content.getBody())
                .featuredImage(content.getFeaturedImage())
                .status(content.getStatus())
                .type(content.getType())
                .authorId(content.getAuthor() != null ? content.getAuthor().getId() : null)
                .authorName(content.getAuthor() != null ? content.getAuthor().getFirstName() + " " + content.getAuthor().getLastName() : null)
                .categoryId(content.getCategory() != null ? content.getCategory().getId() : null)
                .categoryName(content.getCategory() != null ? content.getCategory().getName() : null)
                .createdAt(content.getCreatedAt())
                .publishedAt(content.getPublishedAt())
                .updatedAt(content.getUpdatedAt())
                .build();
    }
}
```