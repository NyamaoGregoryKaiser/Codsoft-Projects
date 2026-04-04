package com.example.secureprojectmanagement.web.controller;

import com.example.secureprojectmanagement.exception.ResourceNotFoundException;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.security.JwtTokenProvider;
import com.example.secureprojectmanagement.service.AuthService;
import com.example.secureprojectmanagement.service.CustomUserDetailsService;
import com.example.secureprojectmanagement.web.dto.JwtResponse;
import com.example.secureprojectmanagement.web.dto.LoginRequest;
import com.example.secureprojectmanagement.web.dto.RegisterRequest;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.stream.Collectors;

@Controller
@RequestMapping
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuthService authService;
    private final CustomUserDetailsService userDetailsService;

    // --- API Endpoints ---
    @PostMapping("/api/auth/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        User user = (User) authentication.getPrincipal(); // Assuming User entity implements UserDetails

        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        // Store JWT in HttpOnly cookie for browser clients for seamless API calls
        Cookie jwtCookie = new Cookie("jwtToken", jwt);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/"); // Accessible from all paths
        jwtCookie.setMaxAge((int) (tokenProvider.getJwtExpirationInMs() / 1000)); // Same as JWT expiration
        // jwtCookie.setSecure(true); // Uncomment in production with HTTPS
        response.addCookie(jwtCookie);

        return ResponseEntity.ok(new JwtResponse(jwt, user.getId(), user.getUsername(), roles));
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            authService.registerUser(registerRequest);
            return new ResponseEntity<>("User registered successfully", HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR); // Role not found
        }
    }

    // --- UI Endpoints ---
    @PostMapping("/register")
    public String registerUserUI(@Valid RegisterRequest registerRequest, BindingResult result, Model model) {
        if (result.hasErrors()) {
            return "register"; // Return to register form with errors
        }
        try {
            authService.registerUser(registerRequest);
            return "redirect:/login?registered=true";
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMessage", e.getMessage());
            return "register";
        } catch (ResourceNotFoundException e) {
            model.addAttribute("errorMessage", "Registration failed: " + e.getMessage());
            return "register";
        }
    }
}