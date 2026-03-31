package com.authsystem.mapper;

import com.authsystem.dto.user.UserDTO;
import com.authsystem.dto.user.UserProfileDTO;
import com.authsystem.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * MapStruct mapper for converting between User entity and DTOs.
 * Handles mappings for different views of user data (e.g., full details for admin, limited for profile).
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * Converts a User entity to a UserDTO (full details, for admin/internal use).
     * Maps roles from Role entities to a Set of role names (Strings).
     *
     * @param user The User entity to convert.
     * @return The resulting UserDTO.
     */
    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user))")
    UserDTO toUserDTO(User user);

    /**
     * Converts a User entity to a UserProfileDTO (limited details, for user's own profile).
     * Maps roles from Role entities to a Set of role names (Strings).
     *
     * @param user The User entity to convert.
     * @return The resulting UserProfileDTO.
     */
    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user))")
    UserProfileDTO toUserProfileDTO(User user);

    // Helper method to map Role objects to their string names
    default Set<String> mapRolesToStrings(User user) {
        return user.getRoles().stream()
                .map(role -> role.getName().name()) // Assuming RoleName is an enum with .name()
                .collect(Collectors.toSet());
    }
}