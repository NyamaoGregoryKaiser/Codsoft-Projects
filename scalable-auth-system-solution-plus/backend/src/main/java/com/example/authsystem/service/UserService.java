package com.example.authsystem.service;

import com.example.authsystem.config.CacheConfig;
import com.example.authsystem.dto.UserDto;
import com.example.authsystem.exception.ResourceNotFoundException;
import com.example.authsystem.mapper.UserMapper;
import com.example.authsystem.model.Role;
import com.example.authsystem.model.User;
import com.example.authsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public User getAuthenticatedUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("No authenticated user found.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.USERS_CACHE, key = "'user:' + #id")
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        log.debug("Retrieved user {} from DB by ID.", user.getEmail());
        return userMapper.toUserDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        User currentUser = getAuthenticatedUserEntity();
        return userMapper.toUserDto(currentUser);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.USERS_CACHE, key = "'allUsers'")
    public List<UserDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        log.debug("Retrieved all users from DB.");
        return userMapper.toUserDtoList(users);
    }

    @Transactional
    @CachePut(value = CacheConfig.USERS_CACHE, key = "'user:' + #result.id")
    @CacheEvict(value = CacheConfig.USERS_CACHE, key = "'allUsers'", allEntries = true)
    public UserDto updateCurrentUser(UserDto userDto) {
        User currentUser = getAuthenticatedUserEntity();

        if (userDto.getEmail() != null && !userDto.getEmail().equals(currentUser.getEmail())) {
            if (userRepository.existsByEmail(userDto.getEmail())) {
                throw new IllegalArgumentException("Email already taken: " + userDto.getEmail());
            }
            currentUser.setEmail(userDto.getEmail());
        }

        if (userDto.getUsername() != null && !userDto.getUsername().equals(currentUser.getUsername())) {
            if (userRepository.existsByUsername(userDto.getUsername())) {
                throw new IllegalArgumentException("Username already taken: " + userDto.getUsername());
            }
            currentUser.setUsername(userDto.getUsername());
        }

        // Apply other updates from DTO, but prevent changing sensitive fields like roles or password via this endpoint
        userMapper.updateUserFromDto(userDto, currentUser);

        User updatedUser = userRepository.save(currentUser);
        log.info("User profile updated: {}", updatedUser.getEmail());
        return userMapper.toUserDto(updatedUser);
    }

    @Transactional
    @CacheEvict(value = CacheConfig.USERS_CACHE, key = "'user:' + #id", allEntries = true) // Evict specific user and allUsers
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
        log.info("User deleted with ID: {}", id);
    }

    public boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(role -> Objects.equals(role.getName(), Role.RoleName.ADMIN));
    }

    public boolean isCurrentUserAdmin() {
        return isAdmin(getAuthenticatedUserEntity());
    }
}