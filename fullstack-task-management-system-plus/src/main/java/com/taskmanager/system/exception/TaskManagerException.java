package com.taskmanager.system.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class TaskManagerException extends RuntimeException {
    private HttpStatus status;
    private String message;

    public TaskManagerException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.message = message;
    }

    public TaskManagerException(String message, HttpStatus status, String message1) {
        super(message);
        this.status = status;
        this.message = message1;
    }
}