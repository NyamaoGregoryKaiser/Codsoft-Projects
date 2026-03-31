package com.authsystem.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Handles unauthorized access attempts in a Spring Security application.
 * This class is invoked when an unauthenticated user tries to access a protected resource.
 * It sends a 401 Unauthorized response to the client.
 */
@Component
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    /**
     * This method is called whenever an exception is thrown due to an unauthenticated user trying to access a protected resource.
     * It sends an HTTP 401 Unauthorized error.
     *
     * @param request       The HttpServletRequest that resulted in an AuthenticationException.
     * @param response      The HttpServletResponse to send the error.
     * @param authException The AuthenticationException that was thrown.
     * @throws IOException      If an input or output error occurs.
     * @throws ServletException If a servlet-specific error occurs.
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        log.error("Responding with unauthorized error. Message - {}", authException.getMessage());
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage());
    }
}