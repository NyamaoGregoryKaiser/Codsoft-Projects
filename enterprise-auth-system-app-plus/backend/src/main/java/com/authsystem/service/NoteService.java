package com.authsystem.service;

import com.authsystem.dto.note.CreateNoteRequest;
import com.authsystem.dto.note.NoteDTO;
import com.authsystem.dto.note.UpdateNoteRequest;
import com.authsystem.entity.Note;
import com.authsystem.entity.User;
import com.authsystem.exception.ResourceNotFoundException;
import com.authsystem.mapper.NoteMapper;
import com.authsystem.repository.NoteRepository;
import com.authsystem.repository.UserRepository;
import com.authsystem.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Service class for managing Note entities.
 * Provides business logic for CRUD operations on notes, including authorization checks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final NoteMapper noteMapper;

    /**
     * Creates a new note for a specific user.
     * Performs authorization check to ensure the requesting user is the owner or an admin.
     *
     * @param createNoteRequest The request containing note details and owner ID.
     * @return The created NoteDTO.
     * @throws ResourceNotFoundException If the user specified in the request is not found.
     * @throws AccessDeniedException If the authenticated user is not authorized to create a note for the target user.
     */
    @Transactional
    public NoteDTO createNote(CreateNoteRequest createNoteRequest) {
        Long currentUserId = getCurrentUserId();
        User owner = userRepository.findById(createNoteRequest.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + createNoteRequest.getUserId()));

        if (!Objects.equals(currentUserId, owner.getId()) && !isAdmin()) {
            throw new AccessDeniedException("You are not authorized to create notes for this user.");
        }

        Note note = noteMapper.toNoteEntityWithUser(createNoteRequest, owner);
        Note savedNote = noteRepository.save(note);
        log.info("Note created with ID: {}", savedNote.getId());
        return noteMapper.toNoteDTO(savedNote);
    }

    /**
     * Retrieves a note by its ID.
     * Performs authorization check to ensure the requesting user is the owner or an admin.
     *
     * @param noteId The ID of the note to retrieve.
     * @return The NoteDTO.
     * @throws ResourceNotFoundException If the note is not found.
     * @throws AccessDeniedException If the authenticated user is not authorized to view this note.
     */
    @Transactional(readOnly = true)
    public NoteDTO getNoteById(Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        Long currentUserId = getCurrentUserId();
        if (!Objects.equals(currentUserId, note.getUser().getId()) && !isAdmin()) {
            throw new AccessDeniedException("You are not authorized to view this note.");
        }
        return noteMapper.toNoteDTO(note);
    }

    /**
     * Retrieves all notes owned by the currently authenticated user.
     *
     * @return A list of NoteDTOs.
     */
    @Transactional(readOnly = true)
    public List<NoteDTO> getAllNotesForCurrentUser() {
        Long currentUserId = getCurrentUserId();
        List<Note> notes = noteRepository.findByUserId(currentUserId);
        return notes.stream()
                .map(noteMapper::toNoteDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all notes in the system (Admin only).
     *
     * @return A list of all NoteDTOs.
     */
    @Transactional(readOnly = true)
    public List<NoteDTO> getAllNotes() {
        // Security check for ADMIN role is done at the controller level via @PreAuthorize
        List<Note> notes = noteRepository.findAll();
        return notes.stream()
                .map(noteMapper::toNoteDTO)
                .collect(Collectors.toList());
    }

    /**
     * Updates an existing note.
     * Performs authorization check to ensure the requesting user is the owner or an admin.
     *
     * @param noteId          The ID of the note to update.
     * @param updateNoteRequest The request containing updated note details.
     * @return The updated NoteDTO.
     * @throws ResourceNotFoundException If the note is not found.
     * @throws AccessDeniedException If the authenticated user is not authorized to update this note.
     */
    @Transactional
    public NoteDTO updateNote(Long noteId, UpdateNoteRequest updateNoteRequest) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        Long currentUserId = getCurrentUserId();
        if (!Objects.equals(currentUserId, note.getUser().getId()) && !isAdmin()) {
            throw new AccessDeniedException("You are not authorized to update this note.");
        }

        noteMapper.updateNoteFromDto(updateNoteRequest, note);
        Note updatedNote = noteRepository.save(note);
        log.info("Note updated with ID: {}", updatedNote.getId());
        return noteMapper.toNoteDTO(updatedNote);
    }

    /**
     * Deletes a note by its ID.
     * Performs authorization check to ensure the requesting user is the owner or an admin.
     *
     * @param noteId The ID of the note to delete.
     * @throws ResourceNotFoundException If the note is not found.
     * @throws AccessDeniedException If the authenticated user is not authorized to delete this note.
     */
    @Transactional
    public void deleteNote(Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        Long currentUserId = getCurrentUserId();
        if (!Objects.equals(currentUserId, note.getUser().getId()) && !isAdmin()) {
            throw new AccessDeniedException("You are not authorized to delete this note.");
        }

        noteRepository.delete(note);
        log.info("Note deleted with ID: {}", noteId);
    }

    /**
     * Retrieves the ID of the currently authenticated user.
     *
     * @return The ID of the current user.
     * @throws AccessDeniedException If no user is authenticated.
     */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetailsService.CustomUserDetails userDetails) {
            return userDetails.getId();
        }
        throw new AccessDeniedException("No authenticated user found.");
    }

    /**
     * Checks if the currently authenticated user has the 'ADMIN' role.
     *
     * @return True if the user is an admin, false otherwise.
     */
    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}