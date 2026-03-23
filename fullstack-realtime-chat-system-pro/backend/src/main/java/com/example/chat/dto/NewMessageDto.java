package com.example.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NewMessageDto {
    @NotNull(message = "Chat room ID is required")
    private Long chatRoomId;
    @NotBlank(message = "Message content cannot be empty")
    private String content;
}