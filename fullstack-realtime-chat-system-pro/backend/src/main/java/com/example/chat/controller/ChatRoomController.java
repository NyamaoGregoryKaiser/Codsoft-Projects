package com.example.chat.controller;

import com.example.chat.dto.ChatRoomCreationDto;
import com.example.chat.dto.ChatRoomDto;
import com.example.chat.exception.AccessDeniedException;
import com.example.chat.exception.ResourceNotFoundException;
import com.example.chat.service.ChatRoomService;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chatrooms")
@RequiredArgsConstructor
@Tag(name = "Chat Rooms", description = "Chat room management APIs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final UserService userService;

    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userService.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in DB."))
                .getId();
    }

    @Operation(summary = "Create a new chat room", responses = {
            @ApiResponse(responseCode = "201", description = "Chat room created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or chat room name taken"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    public ResponseEntity<ChatRoomDto> createChatRoom(@Valid @RequestBody ChatRoomCreationDto creationDto) {
        log.info("Request to create chat room: {}", creationDto.getName());
        Long creatorId = getCurrentUserId();
        ChatRoomDto newRoom = chatRoomService.createChatRoom(creationDto, creatorId);
        return new ResponseEntity<>(newRoom, HttpStatus.CREATED);
    }

    @Operation(summary = "Get all chat rooms a user is part of", responses = {
            @ApiResponse(responseCode = "200", description = "List of chat rooms retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/my-rooms")
    public ResponseEntity<List<ChatRoomDto>> getMyChatRooms() {
        Long userId = getCurrentUserId();
        log.debug("Fetching chat rooms for user ID: {}", userId);
        List<ChatRoomDto> chatRooms = chatRoomService.getChatRoomsByUserId(userId);
        return ResponseEntity.ok(chatRooms);
    }

    @Operation(summary = "Get a chat room by ID", responses = {
            @ApiResponse(responseCode = "200", description = "Chat room details retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Chat room not found"),
            @ApiResponse(responseCode = "403", description = "User not a participant")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ChatRoomDto> getChatRoomById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.debug("Fetching chat room ID: {} for user ID: {}", id, userId);

        // Ensure user is a participant before returning chat room details
        if (!chatRoomService.isUserParticipant(id, userId)) {
            throw new AccessDeniedException("User is not authorized to access chat room with ID: " + id);
        }

        ChatRoomDto chatRoomDto = chatRoomService.getChatRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with ID: " + id));
        return ResponseEntity.ok(chatRoomDto);
    }

    @Operation(summary = "Add a participant to a chat room", responses = {
            @ApiResponse(responseCode = "200", description = "Participant added successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or user already participant"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Not allowed to add participant"),
            @ApiResponse(responseCode = "404", description = "Chat room or user not found")
    })
    @PostMapping("/{chatRoomId}/participants/{userId}")
    public ResponseEntity<ChatRoomDto> addParticipant(@PathVariable Long chatRoomId, @PathVariable Long userId) {
        Long currentUserId = getCurrentUserId();
        log.info("Request to add user ID {} to chat room ID {} by user ID {}", userId, chatRoomId, currentUserId);

        // Optional: Implement authorization logic here, e.g., only creator or admin can add participants
        // For now, any authenticated user can add another user, but this can be restricted.
        // E.g., if (!chatRoomService.getChatRoomById(chatRoomId).map(room -> room.getCreator().getId().equals(currentUserId)).orElse(false)) { ... }

        ChatRoomDto updatedRoom = chatRoomService.addParticipantToChatRoom(chatRoomId, userId);
        return ResponseEntity.ok(updatedRoom);
    }

    // Additional CRUD operations like update/delete chat room could be added here
}