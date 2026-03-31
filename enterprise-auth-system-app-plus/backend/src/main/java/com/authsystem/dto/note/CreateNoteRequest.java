package com.authsystem.dto.note;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for creating a new note.
 * Contains the title, content, and the ID of the user who owns the note.
 */
@Data
@Schema(description = "Request DTO for creating a new note")
public class CreateNoteRequest {
    @NotBlank(message = "Note title must not be empty")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    @Schema(description = "Title of the note", example = "My First Note")
    private String title;

    @NotBlank(message = "Note content must not be empty")
    @Size(max = 1000, message = "Content cannot exceed 1000 characters")
    @Schema(description = "Content of the note", example = "This is the content of my first note. It can be quite long.")
    private String content;

    @NotNull(message = "User ID must be provided")
    @Schema(description = "ID of the user who owns this note", example = "1")
    private Long userId;
}