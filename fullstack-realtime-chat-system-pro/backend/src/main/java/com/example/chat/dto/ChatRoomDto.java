package com.example.chat.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class ChatRoomDto {
    private Long id;
    private String name;
    private String description;
    private UserDto creator;
    private LocalDateTime createdAt;
    private Set<UserDto> participants; // Simplified to just UserDto for participants
    private Set<MessageDto> latestMessages; // Optionally include a few latest messages
}