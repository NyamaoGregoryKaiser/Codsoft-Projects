package com.authsystem.repository;

import com.authsystem.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for the Note entity.
 * Provides standard CRUD operations and custom query methods for notes.
 */
@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    /**
     * Finds all notes belonging to a specific user.
     *
     * @param userId The ID of the user.
     * @return A list of notes owned by the user.
     */
    List<Note> findByUserId(Long userId);
}