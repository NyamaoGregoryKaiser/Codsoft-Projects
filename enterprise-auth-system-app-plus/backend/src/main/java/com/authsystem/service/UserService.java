package com.authsystem.service;

import com.authsystem.dto.user.UserDTO;
import com.authsystem.dto.user.UserProfileDTO;
import com.authsystem.entity.User;
import com.authsystem.exception.ResourceNotFoundException;
import com.authsystem.mapper.UserMapper;
import com.authsystem.repository.UserRepository;
import com.authsystem.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for managing User entities.
 * Provides business logic for retrieving user profiles and (for ADMINs) all users.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @return The UserProfileDTO of the current user.
     * @throws ResourceNotFoundException If the authenticated user is not found in the database.
     * @throws AccessDeniedException If no user is authenticated.
     */
    @Transactional(readOnly = true)
    public UserProfileDTO getCurrentUserProfile() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof CustomUserDetailsService.CustomUserDetails userDetails) {
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + userDetails.getUsername()));
            return userMapper.toUserProfileDTO(user);
        }
        throw new AccessDeniedException("No authenticated user found.");
    }

    /**
     * Retrieves a user by their ID. This method requires 'ADMIN' role.
     *
     * @param userId The ID of the user to retrieve.
     * @return The UserDTO.
     * @throws ResourceNotFoundException If the user is not found.
     */
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return userMapper.toUserDTO(user);
    }

    /**
     * Retrieves all users in the system. This method requires 'ADMIN' role.
     *
     * @return A list of all UserDTOs.
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(userMapper::toUserDTO)
                .collect(Collectors.toList());
    }
}