package com.example.chat.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageDto {
    private Long id;
    private Long chatRoomId;
    private UserDto sender;
    private String content;
    private LocalDateTime timestamp;
}