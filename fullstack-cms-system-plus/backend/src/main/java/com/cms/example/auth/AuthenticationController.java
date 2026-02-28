```java
package com.cms.example.auth;

import com.cms.example.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @Valid @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    // Example endpoint to check authenticated user details
    @PostMapping("/me")
    public ResponseEntity<String> authenticatedUserDetails(@AuthenticationPrincipal User user) {
        if (user != null) {
            return ResponseEntity.ok("Authenticated as: " + user.getEmail() + " with role: " + user.getRole());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No authenticated user.");
    }
}
```