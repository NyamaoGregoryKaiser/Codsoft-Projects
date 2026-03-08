package com.example.authsystem.exception;

import com.example.authsystem.util.ApiError;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        log.error("Resource not found: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.NOT_FOUND, ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleUserAlreadyExistsException(UserAlreadyExistsException ex, WebRequest request) {
        log.warn("User already exists: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.CONFLICT, ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentialsException(InvalidCredentialsException ex, WebRequest request) {
        log.warn("Invalid credentials: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.UNAUTHORIZED, ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ApiError> handleTokenRefreshException(TokenRefreshException ex, WebRequest request) {
        log.warn("Token refresh failed: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.FORBIDDEN, ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        log.error("Illegal argument: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    // Spring Security related exceptions
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentialsException(BadCredentialsException ex, WebRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.UNAUTHORIZED, "Invalid username or password", request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.FORBIDDEN, "Access Denied: You do not have permission to access this resource", request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    // JWT related exceptions
    @ExceptionHandler({SignatureException.class, MalformedJwtException.class})
    public ResponseEntity<ApiError> handleInvalidJwtSignatureException(Exception ex, WebRequest request) {
        log.warn("Invalid JWT signature: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.UNAUTHORIZED, "Invalid JWT signature: " + ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ApiError> handleExpiredJwtException(ExpiredJwtException ex, WebRequest request) {
        log.warn("Expired JWT token: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.UNAUTHORIZED, "Expired JWT token: " + ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UnsupportedJwtException.class)
    public ResponseEntity<ApiError> handleUnsupportedJwtException(UnsupportedJwtException ex, WebRequest request) {
        log.warn("Unsupported JWT token: {}", ex.getMessage());
        ApiError apiError = new ApiError(HttpStatus.UNAUTHORIZED, "Unsupported JWT token: " + ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    // Validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex, WebRequest request) {
        log.warn("Validation error: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        ApiError apiError = new ApiError(HttpStatus.BAD_REQUEST, "Validation Failed", request.getDescription(false), LocalDateTime.now());
        apiError.setDetails(errors);
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }


    // Catch-all for other unexpected exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, WebRequest request) {
        log.error("An unexpected error occurred: {}", ex.getMessage(), ex);
        ApiError apiError = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred: " + ex.getMessage(), request.getDescription(false), LocalDateTime.now());
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}