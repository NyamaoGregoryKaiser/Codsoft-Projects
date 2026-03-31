package com.authsystem.dto.note;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for representing a note.
 * Contains note details, including ID, title, content, and audit information.
 */
@Data
@Schema(description = "DTO for Note details")
public class NoteDTO {
    @Schema(description = "Unique ID of the note", example = "101")
    private Long id;

    @Schema(description = "Title of the note", example = "My First Note")
    private String title;

    @Schema(description = "Content of the note", example = "This is the content of my first note.")
    private String content;

    @Schema(description = "ID of the user who owns this note", example = "1")
    private Long userId;

    @Schema(description = "Username of the user who owns this note", example = "john_doe")
    private String username;

    @Schema(description = "Timestamp when the note was created", example = "2023-10-27T10:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Username of the user who created the note", example = "john_doe")
    private String createdBy;

    @Schema(description = "Timestamp when the note was last updated", example = "2023-10-27T10:30:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Username of the user who last updated the note", example = "john_doe")
    private String updatedBy;
}