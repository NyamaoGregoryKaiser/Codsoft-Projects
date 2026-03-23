package com.example.chat.controller;

import com.example.chat.dto.MessageDto;
import com.example.chat.dto.NewMessageDto;
import com.example.chat.exception.ResourceNotFoundException;
import com.example.chat.service.MessageService;
import com.example.chat.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Chat message handling APIs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate; // For sending messages via WebSocket

    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userService.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in DB."))
                .getId();
    }

    @Operation(summary = "Get messages for a specific chat room", responses = {
            @ApiResponse(responseCode = "200", description = "List of messages retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "User not a participant")
    })
    @GetMapping("/room/{chatRoomId}")
    public ResponseEntity<List<MessageDto>> getChatRoomMessages(
            @PathVariable Long chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userId = getCurrentUserId();
        log.debug("Fetching messages for chat room {} by user {}", chatRoomId, userId);
        List<MessageDto> messages = messageService.getMessagesForChatRoom(chatRoomId, userId, page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * WebSocket endpoint for sending messages.
     * Messages sent to /app/chat/{chatRoomId} will be processed here.
     * The response will be broadcast to /topic/chatroom.{chatRoomId}.messages
     * @param newMessage DTO containing chatRoomId and content
     * @param principal Authenticated user's principal
     */
    @MessageMapping("/chat/{chatRoomId}") // /app/chat/{chatRoomId}
    public void sendChatMessage(@DestinationVariable Long chatRoomId, @Payload @Valid NewMessageDto newMessage, Principal principal) {
        // Principal's name is the username in Spring Security UserDetails
        String username = principal.getName();
        log.info("Received WebSocket message for room {} from user {}: {}", chatRoomId, username, newMessage.getContent());

        // We need to fetch the full User entity to get the ID
        Long senderId = userService.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found for username: " + username))
                .getId();

        newMessage.setChatRoomId(chatRoomId); // Ensure chatRoomId is set in DTO

        // Save the message to the database
        MessageDto savedMessage = messageService.saveMessage(newMessage, senderId);

        // Broadcast the message to all subscribers of the specific chat room's topic
        messagingTemplate.convertAndSend("/topic/chatroom." + chatRoomId + ".messages", savedMessage);
        log.debug("Message {} broadcast to /topic/chatroom.{}.messages", savedMessage.getId(), chatRoomId);
    }
}