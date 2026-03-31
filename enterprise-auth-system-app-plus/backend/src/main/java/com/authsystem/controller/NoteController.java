package com.authsystem.controller;

import com.authsystem.dto.note.CreateNoteRequest;
import com.authsystem.dto.note.NoteDTO;
import com.authsystem.dto.note.UpdateNoteRequest;
import com.authsystem.service.NoteService;
import com.authsystem.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing notes.
 * Provides CRUD operations for notes with role-based authorization.
 */
@RestController
@RequestMapping(AppConstants.API_BASE + "/notes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notes", description = "CRUD operations for user notes")
@SecurityRequirement(name = "bearerAuth") // Requires JWT for all note operations
public class NoteController {

    private final NoteService noteService;

    /**
     * Creates a new note. Requires 'USER' or 'ADMIN' role.
     *
     * @param createNoteRequest The request containing note details.
     * @return A ResponseEntity with the created NoteDTO.
     */
    @Operation(summary = "Create a new note", responses = {
            @ApiResponse(responseCode = "201", description = "Note created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Insufficient role")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<NoteDTO> createNote(@Valid @RequestBody CreateNoteRequest createNoteRequest) {
        log.info("Creating note for user: {}", createNoteRequest.getUserId());
        NoteDTO createdNote = noteService.createNote(createNoteRequest);
        return new ResponseEntity<>(createdNote, HttpStatus.CREATED);
    }

    /**
     * Retrieves a note by its ID. Requires 'USER' or 'ADMIN' role.
     * Users can only retrieve their own notes unless they are an ADMIN.
     *
     * @param noteId The ID of the note to retrieve.
     * @return A ResponseEntity with the NoteDTO.
     */
    @Operation(summary = "Get a note by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Note found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your note or insufficient role"),
            @ApiResponse(responseCode = "404", description = "Note not found")
    })
    @GetMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<NoteDTO> getNoteById(@Parameter(description = "ID of the note to retrieve") @PathVariable Long noteId) {
        log.info("Retrieving note with ID: {}", noteId);
        NoteDTO note = noteService.getNoteById(noteId);
        return ResponseEntity.ok(note);
    }

    /**
     * Retrieves all notes for the authenticated user. Requires 'USER' or 'ADMIN' role.
     *
     * @return A ResponseEntity with a list of NoteDTOs.
     */
    @Operation(summary = "Get all notes for the authenticated user", responses = {
            @ApiResponse(responseCode = "200", description = "List of notes retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Insufficient role")
    })
    @GetMapping("/my-notes")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<NoteDTO>> getAllNotesForCurrentUser() {
        log.info("Retrieving all notes for current user.");
        List<NoteDTO> notes = noteService.getAllNotesForCurrentUser();
        return ResponseEntity.ok(notes);
    }

    /**
     * Retrieves all notes (admin access). Requires 'ADMIN' role.
     *
     * @return A ResponseEntity with a list of all NoteDTOs.
     */
    @Operation(summary = "Get all notes (Admin only)", responses = {
            @ApiResponse(responseCode = "200", description = "List of all notes retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    })
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NoteDTO>> getAllNotes() {
        log.info("Retrieving all notes (Admin access).");
        List<NoteDTO> notes = noteService.getAllNotes();
        return ResponseEntity.ok(notes);
    }

    /**
     * Updates an existing note. Requires 'USER' or 'ADMIN' role.
     * Users can only update their own notes unless they are an ADMIN.
     *
     * @param noteId          The ID of the note to update.
     * @param updateNoteRequest The request containing updated note details.
     * @return A ResponseEntity with the updated NoteDTO.
     */
    @Operation(summary = "Update an existing note", responses = {
            @ApiResponse(responseCode = "200", description = "Note updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your note or insufficient role"),
            @ApiResponse(responseCode = "404", description = "Note not found")
    })
    @PutMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<NoteDTO> updateNote(@Parameter(description = "ID of the note to update") @PathVariable Long noteId,
                                              @Valid @RequestBody UpdateNoteRequest updateNoteRequest) {
        log.info("Updating note with ID: {}", noteId);
        NoteDTO updatedNote = noteService.updateNote(noteId, updateNoteRequest);
        return ResponseEntity.ok(updatedNote);
    }

    /**
     * Deletes a note by its ID. Requires 'USER' or 'ADMIN' role.
     * Users can only delete their own notes unless they are an ADMIN.
     *
     * @param noteId The ID of the note to delete.
     * @return A ResponseEntity with a success message.
     */
    @Operation(summary = "Delete a note by ID", responses = {
            @ApiResponse(responseCode = "204", description = "Note deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your note or insufficient role"),
            @ApiResponse(responseCode = "404", description = "Note not found")
    })
    @DeleteMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Void> deleteNote(@Parameter(description = "ID of the note to delete") @PathVariable Long noteId) {
        log.info("Deleting note with ID: {}", noteId);
        noteService.deleteNote(noteId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}