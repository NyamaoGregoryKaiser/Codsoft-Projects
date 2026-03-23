package com.example.chat.config;

import com.example.chat.jwt.JwtTokenUtil;
import com.example.chat.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.Objects;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/user"); // Enable a simple in-memory message broker
        config.setApplicationDestinationPrefixes("/app"); // Prefix for messages from clients to the server
        config.setUserDestinationPrefix("/user"); // Prefix for user-specific messages
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registers the /websocket endpoint, enabling SockJS fallback options for browsers that don't support WebSockets
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns("http://localhost:3000", "http://frontend:3000") // Allowed origins for CORS
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
                    String jwtToken = null;
                    if (authorizationHeaders != null && !authorizationHeaders.isEmpty()) {
                        String bearerToken = authorizationHeaders.get(0);
                        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                            jwtToken = bearerToken.substring(7);
                        }
                    }

                    if (jwtToken != null) {
                        try {
                            String username = jwtTokenUtil.extractUsername(jwtToken);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            if (jwtTokenUtil.validateToken(jwtToken, userDetails)) {
                                Authentication authentication = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                accessor.setUser(authentication); // Set the authenticated user in the WebSocket session
                            }
                        } catch (Exception e) {
                            System.err.println("WebSocket JWT authentication failed: " + e.getMessage());
                            // Optionally, disconnect the client or reject connection
                            // accessor.setLeaveMutable(true);
                            // accessor.setNativeHeader("error", "Authentication failed");
                            // return null; // Reject connection
                        }
                    }
                }
                return message;
            }
        });
    }
}