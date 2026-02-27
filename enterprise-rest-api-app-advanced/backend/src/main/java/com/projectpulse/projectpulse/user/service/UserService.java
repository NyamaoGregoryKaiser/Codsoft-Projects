package com.projectpulse.projectpulse.user.service;

import com.projectpulse.projectpulse.exception.ResourceNotFoundException;
import com.projectpulse.projectpulse.user.dto.UserDto;
import com.projectpulse.projectpulse.user.dto.UserRegisterDto;
import com.projectpulse.projectpulse.user.dto.UserUpdateDto;
import com.projectpulse.projectpulse.user.entity.User;
import com.projectpulse.projectpulse.user.repository.UserRepository;
import com.projectpulse.projectpulse.util.Mappers;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(UserRegisterDto registerDto) {
        if (userRepository.existsByUsername(registerDto.getUsername())) {
            throw new IllegalArgumentException("Username '" + registerDto.getUsername() + "' already exists.");
        }
        if (userRepository.existsByEmail(registerDto.getEmail())) {
            throw new IllegalArgumentException("Email '" + registerDto.getEmail() + "' already exists.");
        }

        User user = Mappers.toUserEntity(registerDto);
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        // Default role is USER, can be explicitly set for ADMIN for initial setup if needed
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Cacheable(value = "users", key = "#id")
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return Mappers.toUserDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(Mappers::toUserDto)
                .collect(Collectors.toList());
    }

    @CachePut(value = "users", key = "#id")
    @Transactional
    public UserDto updateUser(Long id, UserUpdateDto updateDto) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        Optional.ofNullable(updateDto.getUsername()).ifPresent(username -> {
            if (!username.equals(existingUser.getUsername()) && userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username '" + username + "' already exists.");
            }
            existingUser.setUsername(username);
        });
        Optional.ofNullable(updateDto.getEmail()).ifPresent(email -> {
            if (!email.equals(existingUser.getEmail()) && userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email '" + email + "' already exists.");
            }
            existingUser.setEmail(email);
        });
        Optional.ofNullable(updateDto.getPassword()).ifPresent(password ->
                existingUser.setPassword(passwordEncoder.encode(password)));

        User updatedUser = userRepository.save(existingUser);
        return Mappers.toUserDto(updatedUser);
    }

    @CacheEvict(value = {"users", "projects", "tasks"}, key = "#id", allEntries = false)
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}