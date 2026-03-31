package com.authsystem.dto.note;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for updating an existing note.
 * Allows updating title and content.
 */
@Data
@Schema(description = "Request DTO for updating an existing note")
public class UpdateNoteRequest {
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    @Schema(description = "New title for the note", example = "My Updated Note Title")
    private String title;

    @Size(max = 1000, message = "Content cannot exceed 1000 characters")
    @Schema(description = "New content for the note", example = "This is the updated content of my note.")
    private String content;
}