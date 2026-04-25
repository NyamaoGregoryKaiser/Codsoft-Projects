package com.mlutil.auth;

import com.mlutil.dto.AuthRequest;
import com.mlutil.dto.AuthResponse;
import com.mlutil.model.User;
import com.mlutil.repository.UserRepository;
import com.mlutil.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse authenticateUser(AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getUsername(),
                        authRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String[] roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toArray(String[]::new);

        log.info("User '{}' authenticated successfully.", authRequest.getUsername());
        return new AuthResponse(jwt, userDetails.getUsername(), roles);
    }

    @Transactional
    public User registerUser(AuthRequest authRequest, Set<String> roles) {
        if (userRepository.existsByUsername(authRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }

        User user = new User(
                authRequest.getUsername(),
                passwordEncoder.encode(authRequest.getPassword()),
                String.join(",", roles)
        );

        User savedUser = userRepository.save(user);
        log.info("User '{}' registered successfully with roles: {}", savedUser.getUsername(), savedUser.getRoles());
        return savedUser;
    }
}