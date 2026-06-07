```java
package com.example.authsystem.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.UUID;

@Component
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String correlationId = UUID.randomUUID().toString(); // Generate correlation ID for each request

        // Wrap request and response to allow multiple reads of body
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logRequest(wrappedRequest, wrappedResponse, correlationId, duration);
            wrappedResponse.copyBodyToResponse(); // Ensure the response body is written back to the client
        }
    }

    private void logRequest(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response, String correlationId, long duration) {
        String method = request.getMethod();
        String requestUri = request.getRequestURI();
        int status = response.getStatus();
        String user = getUserIdentifier();

        log.info("[{}][{}][{}] {} {} from user {} - {}ms",
                correlationId, method, status, requestUri, request.getQueryString() != null ? "?" + request.getQueryString() : "", user, duration);

        // Optionally log request/response headers and body for debugging/auditing, but be cautious with sensitive data
        if (log.isDebugEnabled()) {
            log.debug("[{}][Request Headers]: {}", correlationId, extractHeaders(request));
            log.debug("[{}][Request Body]: {}", correlationId, getRequestBody(request));
            log.debug("[{}][Response Headers]: {}", correlationId, extractHeaders(response));
            log.debug("[{}][Response Body]: {}", correlationId, getResponseBody(response));
        }
    }

    private String getUserIdentifier() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !(authentication.getPrincipal() instanceof String && authentication.getPrincipal().equals("anonymousUser"))) {
            return authentication.getName(); // Returns email for our UserDetails implementation
        }
        return "anonymous";
    }

    private String getRequestBody(ContentCachingRequestWrapper request) {
        byte[] content = request.getContentAsByteArray();
        if (content.length > 0) {
            try {
                return new String(content, request.getCharacterEncoding());
            } catch (Exception e) {
                return "[UNREADABLE BODY]";
            }
        }
        return "";
    }

    private String getResponseBody(ContentCachingResponseWrapper response) {
        byte[] content = response.getContentAsByteArray();
        if (content.length > 0) {
            try {
                return new String(content, response.getCharacterEncoding());
            } catch (Exception e) {
                return "[UNREADABLE BODY]";
            }
        }
        return "";
    }

    private String extractHeaders(HttpServletRequest request) {
        StringBuilder headers = new StringBuilder();
        request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
            headers.append(headerName).append(": ").append(request.getHeader(headerName)).append("; ");
        });
        return headers.toString();
    }

    private String extractHeaders(HttpServletResponse response) {
        StringBuilder headers = new StringBuilder();
        response.getHeaderNames().forEach(headerName -> {
            headers.append(headerName).append(": ").append(response.getHeader(headerName)).append("; ");
        });
        return headers.toString();
    }
}
```