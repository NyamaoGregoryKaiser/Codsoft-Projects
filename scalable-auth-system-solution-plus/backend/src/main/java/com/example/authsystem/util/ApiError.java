package com.example.authsystem.util;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ApiError {
    private HttpStatus status;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy hh:mm:ss")
    private LocalDateTime timestamp;
    private String message;
    private String debugMessage;
    private Map<String, String> details; // For validation errors

    public ApiError(HttpStatus status, String message, String debugMessage, LocalDateTime timestamp) {
        this.status = status;
        this.message = message;
        this.debugMessage = debugMessage;
        this.timestamp = timestamp;
    }

    public ApiError(HttpStatus status, String message, String debugMessage) {
        this(status, message, debugMessage, LocalDateTime.now());
    }
}