```java
package com.mlutil.core.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiErrorResponse {
    private LocalDateTime timestamp;
    private HttpStatus status;
    private int statusCode;
    private String error;
    private String message;
    private String path;

    public ApiErrorResponse(HttpStatus status, String message, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.statusCode = status.value();
        this.error = status.getReasonPhrase();
        this.message = message;
        this.path = path;
    }
}
```