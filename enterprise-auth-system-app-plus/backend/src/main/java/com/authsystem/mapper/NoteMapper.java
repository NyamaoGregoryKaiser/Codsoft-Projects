package com.authsystem.mapper;

import com.authsystem.dto.note.CreateNoteRequest;
import com.authsystem.dto.note.NoteDTO;
import com.authsystem.dto.note.UpdateNoteRequest;
import com.authsystem.entity.Note;
import com.authsystem.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * MapStruct mapper for converting between Note entity and DTOs.
 * Handles mappings for creation, update, and retrieval of notes.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface NoteMapper {

    /**
     * Converts a Note entity to a NoteDTO.
     * Maps the user's ID and username to the DTO.
     *
     * @param note The Note entity to convert.
     * @return The resulting NoteDTO.
     */
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", source = "user.username")
    NoteDTO toNoteDTO(Note note);

    /**
     * Converts a CreateNoteRequest DTO to a Note entity.
     * The 'user' field needs to be set manually as it's a relation.
     *
     * @param request The CreateNoteRequest DTO.
     * @return The resulting Note entity.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true) // User must be set manually based on userId in service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    Note toNoteEntity(CreateNoteRequest request);

    /**
     * Updates an existing Note entity from an UpdateNoteRequest DTO.
     * Ignores null fields in the DTO, preserving existing values in the entity.
     *
     * @param request The UpdateNoteRequest DTO.
     * @param note    The existing Note entity to update.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateNoteFromDto(UpdateNoteRequest request, @MappingTarget Note note);

    /**
     * Helper method to set the user on a Note entity when creating.
     *
     * @param request The CreateNoteRequest DTO.
     * @param user    The User entity to associate.
     * @return A new Note entity with fields from request and the associated user.
     */
    default Note toNoteEntityWithUser(CreateNoteRequest request, User user) {
        Note note = toNoteEntity(request);
        note.setUser(user);
        return note;
    }
}