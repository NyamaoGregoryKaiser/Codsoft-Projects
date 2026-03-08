package com.example.authsystem.service;

import com.example.authsystem.dto.AuthRequest;
import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.RegisterRequest;
import com.example.authsystem.dto.RefreshTokenRequest;
import com.example.authsystem.exception.InvalidCredentialsException;
import com.example.authsystem.exception.ResourceNotFoundException;
import com.example.authsystem.exception.TokenRefreshException;
import com.example.authsystem.exception.UserAlreadyExistsException;
import com.example.authsystem.mapper.UserMapper;
import com.example.authsystem.model.RefreshToken;
import com.example.authsystem.model.Role;
import com.example.authsystem.model.User;
import com.example.authsystem.repository.RefreshTokenRepository;
import com.example.authsystem.repository.RoleRepository;
import com.example.authsystem.repository.UserRepository;
import com.example.authsystem.security.JwtService;
import com.example.authsystem.util.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;

    @Value("${application.security.jwt.refresh-token.expiration}")
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered: " + request.getEmail());
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken: " + request.getUsername());
        }

        Role userRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", Role.RoleName.USER));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true) // User is enabled by default, could add email verification flow
                .roles(java.util.Set.of(userRole))
                .build();

        User savedUser = userRepository.save(user);

        String jwtToken = jwtService.generateToken(savedUser);
        RefreshToken refreshToken = createRefreshToken(savedUser);

        log.info("User registered successfully: {}", savedUser.getEmail());
        AuthResponse authResponse = userMapper.toAuthResponse(savedUser);
        authResponse.setAccessToken(jwtToken);
        authResponse.setRefreshToken(refreshToken.getToken());
        return authResponse;
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            log.warn("Invalid login attempt for email: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("User not found with email: " + request.getEmail()));

        if (!user.isEnabled()) {
            throw new InvalidCredentialsException("User account is not enabled");
        }

        String jwtToken = jwtService.generateToken(user);
        RefreshToken refreshToken = createRefreshToken(user); // Will update if already exists

        log.info("User logged in successfully: {}", user.getEmail());
        AuthResponse authResponse = userMapper.toAuthResponse(user);
        authResponse.setAccessToken(jwtToken);
        authResponse.setRefreshToken(refreshToken.getToken());
        return authResponse;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        Optional<RefreshToken> existingToken = refreshTokenRepository.findByUser(user);
        if (existingToken.isPresent()) {
            RefreshToken token = existingToken.get();
            token.setToken(UUID.randomUUID().toString());
            token.setExpiryDate(Instant.now().plusMillis(refreshTokenExpirationMs));
            return refreshTokenRepository.save(token);
        } else {
            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .token(UUID.randomUUID().toString())
                    .expiryDate(Instant.now().plusMillis(refreshTokenExpirationMs))
                    .build();
            return refreshTokenRepository.save(refreshToken);
        }
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new TokenRefreshException("Refresh token is not found or invalid!"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new TokenRefreshException("Refresh token was expired. Please make a new sign-in request");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user);
        RefreshToken newRefreshToken = createRefreshToken(user); // Generate new refresh token for rotation

        log.info("Access token refreshed for user: {}", user.getEmail());
        AuthResponse authResponse = userMapper.toAuthResponse(user);
        authResponse.setAccessToken(newAccessToken);
        authResponse.setRefreshToken(newRefreshToken.getToken());
        return authResponse;
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            String token = UUID.randomUUID().toString();
            long expiryTime = System.currentTimeMillis() + AppConstants.PASSWORD_RESET_TOKEN_EXPIRATION_MS; // 15 minutes
            user.setPasswordResetToken(token);
            user.setPasswordResetTokenExpiry(expiryTime);
            userRepository.save(user);
            log.info("Password reset token generated for user: {}", email);

            // TODO: In a real application, send this token via email to the user
            // Example: emailService.sendPasswordResetEmail(user.getEmail(), token);
            log.info("Password reset token for {} is: {}", email, token); // For development purposes
        } else {
            log.warn("Password reset requested for non-existent email: {}", email);
            // We intentionally don't throw an error here to prevent email enumeration attacks.
            // A generic success message should be returned to the client.
        }
    }

    @Transactional
    public void confirmPasswordReset(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Password reset token is invalid or expired."));

        if (user.getPasswordResetTokenExpiry() == null || user.getPasswordResetTokenExpiry() < System.currentTimeMillis()) {
            throw new IllegalArgumentException("Password reset token is expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null); // Clear the token after use
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    @Transactional
    public void logoutUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        refreshTokenRepository.deleteByUser(user);
        log.info("User {} logged out, refresh token deleted.", user.getEmail());
    }

    @Transactional
    public void logoutAllUsersExceptCurrent(Long currentUserId) {
        // Implement logic to delete all refresh tokens except the one belonging to the current session
        // This would typically involve invalidating specific refresh token or user's all refresh tokens
        // This example deletes all tokens for a user, so a more granular approach would be needed.
        // For simplicity, this example just deletes *all* tokens for the user in `logoutUser`.
    }

    @Transactional
    public void deleteExpiredRefreshTokens() {
        log.info("Cleaning up expired refresh tokens...");
        int deletedCount = refreshTokenRepository.deleteByExpiryDateBefore(Instant.now());
        if (deletedCount > 0) {
            log.info("Deleted {} expired refresh tokens.", deletedCount);
        } else {
            log.info("No expired refresh tokens found to delete.");
        }
    }
}