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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id(1L).name(Role.RoleName.USER).build();
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        // Inject refresh token expiration for testing
        ReflectionTestUtils.setField(authService, "refreshTokenExpirationMs", 604800000L); // 7 days
    }

    @Test
    void register_success() {
        RegisterRequest request = new RegisterRequest("newuser", "new@example.com", "password123");
        User newUser = User.builder().id(2L).username("newuser").email("new@example.com").password("encodedPass").roles(Set.of(userRole)).enabled(true).build();
        AuthResponse expectedResponse = AuthResponse.builder().accessToken("jwt").refreshToken("refresh").email("new@example.com").build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.USER)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenReturn(newUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(RefreshToken.builder().token("refresh").build());
        when(userMapper.toAuthResponse(any(User.class))).thenReturn(AuthResponse.builder().build()); // Mock mapper to avoid null issues
        when(userMapper.toAuthResponse(any(User.class))).thenAnswer(invocation -> {
            User userArg = invocation.getArgument(0);
            return AuthResponse.builder()
                    .userId(userArg.getId())
                    .username(userArg.getUsername())
                    .email(userArg.getEmail())
                    .roles(Set.of(userRole.getName().name()))
                    .build();
        });

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("jwt");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
        assertThat(response.getEmail()).isEqualTo("new@example.com");

        verify(userRepository, times(1)).save(any(User.class));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void register_emailAlreadyExists_throwsUserAlreadyExistsException() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123");
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_usernameAlreadyExists_throwsUserAlreadyExistsException() {
        RegisterRequest request = new RegisterRequest("testuser", "new@example.com", "password123");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_success() {
        AuthRequest request = new AuthRequest("test@example.com", "password123");
        RefreshToken refreshToken = RefreshToken.builder().id(1L).user(testUser).token("refresh_token_value").expiryDate(Instant.now().plusSeconds(3600)).build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null); // Just needs to not throw exception
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(testUser)).thenReturn("new_access_token");
        when(refreshTokenRepository.findByUser(testUser)).thenReturn(Optional.empty()); // No existing token for this user
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(refreshToken);
        when(userMapper.toAuthResponse(any(User.class))).thenAnswer(invocation -> {
            User userArg = invocation.getArgument(0);
            return AuthResponse.builder()
                    .userId(userArg.getId())
                    .username(userArg.getUsername())
                    .email(userArg.getEmail())
                    .roles(Set.of(userRole.getName().name()))
                    .build();
        });


        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("new_access_token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh_token_value");
        assertThat(response.getEmail()).isEqualTo("test@example.com");

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void login_invalidCredentials_throwsInvalidCredentialsException() {
        AuthRequest request = new AuthRequest("test@example.com", "wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtService, never()).generateToken(any(User.class));
    }

    @Test
    void login_userNotFound_throwsInvalidCredentialsException() {
        AuthRequest request = new AuthRequest("test@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
        verify(jwtService, never()).generateToken(any(User.class));
    }

    @Test
    void refreshToken_success() {
        RefreshToken existingRefreshToken = RefreshToken.builder()
                .id(1L)
                .user(testUser)
                .token("old_refresh_token")
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();
        RefreshToken newRefreshToken = RefreshToken.builder()
                .id(1L)
                .user(testUser)
                .token("new_refresh_token")
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();
        RefreshTokenRequest request = new RefreshTokenRequest("old_refresh_token");

        when(refreshTokenRepository.findByToken(request.getRefreshToken())).thenReturn(Optional.of(existingRefreshToken));
        when(jwtService.generateToken(testUser)).thenReturn("refreshed_access_token");
        when(refreshTokenRepository.findByUser(testUser)).thenReturn(Optional.of(existingRefreshToken)); // Existing token found for update
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(newRefreshToken);
        when(userMapper.toAuthResponse(any(User.class))).thenAnswer(invocation -> {
            User userArg = invocation.getArgument(0);
            return AuthResponse.builder()
                    .userId(userArg.getId())
                    .username(userArg.getUsername())
                    .email(userArg.getEmail())
                    .roles(Set.of(userRole.getName().name()))
                    .build();
        });


        AuthResponse response = authService.refreshToken(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("refreshed_access_token");
        assertThat(response.getRefreshToken()).isEqualTo("new_refresh_token");
        assertThat(response.getEmail()).isEqualTo("test@example.com");

        verify(refreshTokenRepository, times(1)).findByToken(anyString());
        verify(jwtService, times(1)).generateToken(any(User.class));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void refreshToken_invalidToken_throwsTokenRefreshException() {
        RefreshTokenRequest request = new RefreshTokenRequest("invalid_token");
        when(refreshTokenRepository.findByToken(request.getRefreshToken())).thenReturn(Optional.empty());

        assertThrows(TokenRefreshException.class, () -> authService.refreshToken(request));
        verify(jwtService, never()).generateToken(any(User.class));
    }

    @Test
    void refreshToken_expiredToken_throwsTokenRefreshException() {
        RefreshToken expiredRefreshToken = RefreshToken.builder()
                .id(1L)
                .user(testUser)
                .token("expired_token")
                .expiryDate(Instant.now().minusSeconds(1)) // Expired
                .build();
        RefreshTokenRequest request = new RefreshTokenRequest("expired_token");

        when(refreshTokenRepository.findByToken(request.getRefreshToken())).thenReturn(Optional.of(expiredRefreshToken));

        assertThrows(TokenRefreshException.class, () -> authService.refreshToken(request));
        verify(refreshTokenRepository, times(1)).delete(expiredRefreshToken); // Should delete expired token
        verify(jwtService, never()).generateToken(any(User.class));
    }

    @Test
    void requestPasswordReset_userExists_tokenGenerated() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        authService.requestPasswordReset(testUser.getEmail());

        assertThat(testUser.getPasswordResetToken()).isNotNull();
        assertThat(testUser.getPasswordResetTokenExpiry()).isNotNull();
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void requestPasswordReset_userDoesNotExist_noErrorThrown() {
        String nonExistentEmail = "nonexistent@example.com";
        when(userRepository.findByEmail(nonExistentEmail)).thenReturn(Optional.empty());

        authService.requestPasswordReset(nonExistentEmail); // Should not throw an error
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void confirmPasswordReset_success() {
        testUser.setPasswordResetToken("validToken");
        testUser.setPasswordResetTokenExpiry(System.currentTimeMillis() + 60000); // 1 minute from now

        when(userRepository.findByPasswordResetToken("validToken")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("newpassword")).thenReturn("newHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        authService.confirmPasswordReset("validToken", "newpassword");

        assertThat(testUser.getPassword()).isEqualTo("newHashedPassword");
        assertThat(testUser.getPasswordResetToken()).isNull();
        assertThat(testUser.getPasswordResetTokenExpiry()).isNull();
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void confirmPasswordReset_invalidToken_throwsResourceNotFoundException() {
        when(userRepository.findByPasswordResetToken("invalidToken")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.confirmPasswordReset("invalidToken", "newpassword"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void confirmPasswordReset_expiredToken_throwsIllegalArgumentException() {
        testUser.setPasswordResetToken("expiredToken");
        testUser.setPasswordResetTokenExpiry(System.currentTimeMillis() - 1000); // 1 second ago

        when(userRepository.findByPasswordResetToken("expiredToken")).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () -> authService.confirmPasswordReset("expiredToken", "newpassword"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void logoutUser_success() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(refreshTokenRepository.deleteByUser(testUser)).thenReturn(1);

        authService.logoutUser(testUser.getId());

        verify(refreshTokenRepository, times(1)).deleteByUser(testUser);
    }

    @Test
    void logoutUser_userNotFound_throwsResourceNotFoundException() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.logoutUser(99L));
        verify(refreshTokenRepository, never()).deleteByUser(any(User.class));
    }

    @Test
    void deleteExpiredRefreshTokens_success() {
        when(refreshTokenRepository.deleteByExpiryDateBefore(any(Instant.class))).thenReturn(5);

        authService.deleteExpiredRefreshTokens();

        verify(refreshTokenRepository, times(1)).deleteByExpiryDateBefore(any(Instant.class));
    }
}