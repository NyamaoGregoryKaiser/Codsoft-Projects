package com.cms.system.service;

import com.cms.system.dto.user.UserDto;
import com.cms.system.dto.user.UserRequest;
import com.cms.system.exception.ResourceNotFoundException;
import com.cms.system.exception.ApiException;
import com.cms.system.model.Role;
import com.cms.system.model.User;
import com.cms.system.repository.UserRepository;
import com.cms.system.repository.RoleRepository;
import com.cms.system.util.MapperUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.cms.system.model.Role.ERole;

@Service
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository; // Assuming RoleRepository for simplicity
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public UserDto createUser(UserRequest userRequest) {
        if (userRepository.existsByUsername(userRequest.getUsername())) {
            throw new ApiException("Username is already taken!");
        }
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new ApiException("Email is already in use!");
        }

        User user = new User();
        user.setUsername(userRequest.getUsername());
        user.setEmail(userRequest.getEmail());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setRoles(getRolesFromStrings(userRequest.getRoles()));
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        log.info("User created: {}", savedUser.getUsername());
        return MapperUtil.toUserDto(savedUser);
    }

    @Cacheable(value = "users", key = "#id")
    public UserDto getUserById(Long id) {
        log.debug("Fetching user with ID: {} from DB", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
        return MapperUtil.toUserDto(user);
    }

    @Cacheable(value = "users", key = "#username")
    public UserDto getUserByUsername(String username) {
        log.debug("Fetching user with username: {} from DB", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username " + username));
        return MapperUtil.toUserDto(user);
    }

    public Page<UserDto> getAllUsers(Pageable pageable) {
        log.debug("Fetching all users, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable).map(MapperUtil::toUserDto);
    }

    @Transactional
    @CachePut(value = "users", key = "#id")
    public UserDto updateUser(Long id, UserRequest userRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        if (userRequest.getUsername() != null && !userRequest.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(userRequest.getUsername())) {
                throw new ApiException("Username is already taken!");
            }
            user.setUsername(userRequest.getUsername());
        }
        if (userRequest.getEmail() != null && !userRequest.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(userRequest.getEmail())) {
                throw new ApiException("Email is already in use!");
            }
            user.setEmail(userRequest.getEmail());
        }
        if (userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }
        if (userRequest.getRoles() != null && !userRequest.getRoles().isEmpty()) {
            user.setRoles(getRolesFromStrings(userRequest.getRoles()));
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated: {}", updatedUser.getUsername());
        return MapperUtil.toUserDto(updatedUser);
    }

    @Transactional
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id " + id);
        }
        userRepository.deleteById(id);
        log.info("User with ID {} deleted", id);
    }

    public Set<Role> getRolesFromStrings(Set<String> strRoles) {
        Set<Role> roles = new HashSet<>();
        if (strRoles == null || strRoles.isEmpty()) {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "ROLE_ADMIN":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new ResourceNotFoundException("Error: Role Admin is not found."));
                        roles.add(adminRole);
                        break;
                    case "ROLE_EDITOR":
                        Role modRole = roleRepository.findByName(ERole.ROLE_EDITOR)
                                .orElseThrow(() -> new ResourceNotFoundException("Error: Role Editor is not found."));
                        roles.add(modRole);
                        break;
                    default:
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new ResourceNotFoundException("Error: Role User is not found."));
                        roles.add(userRole);
                }
            });
        }
        return roles;
    }

    // Helper to load user by username (for Spring Security)
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}