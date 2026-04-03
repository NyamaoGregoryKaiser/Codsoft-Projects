```java
package com.example.authsystem.user.service;

import com.example.authsystem.common.exception.ResourceNotFoundException;
import com.example.authsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom implementation of UserDetailsService to load user-specific data during authentication.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Locates the user based on the username (email).
     * @param username The username (email) identifying the user whose data is required.
     * @return A fully populated user record (User entity implementing UserDetails).
     * @throws UsernameNotFoundException If the user could not be found or has no granted authorities.
     */
    @Override
    @Cacheable(value = "users", key = "#username") // Cache user details by email
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Attempting to load user by username (email): {}", username);
        return userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    log.warn("User with email {} not found.", username);
                    return new UsernameNotFoundException("User not found with email: " + username);
                });
    }
}
```