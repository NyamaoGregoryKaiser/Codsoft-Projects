package com.example.chat.service;

import com.example.chat.dto.MessageDto;
import com.example.chat.dto.NewMessageDto;
import com.example.chat.entity.ChatRoom;
import com.example.chat.entity.Message;
import com.example.chat.entity.User;
import com.example.chat.exception.AccessDeniedException;
import com.example.chat.exception.ResourceNotFoundException;
import com.example.chat.repository.ChatRoomRepository;
import com.example.chat.repository.MessageRepository;
import com.example.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatRoomService chatRoomService; // To check participant status
    private final UserService userService; // To map User to UserDto

    @Transactional
    public MessageDto saveMessage(NewMessageDto newMessage, Long senderId) {
        log.info("Saving new message for chat room {} by sender {}", newMessage.getChatRoomId(), senderId);

        ChatRoom chatRoom = chatRoomRepository.findById(newMessage.getChatRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with ID: " + newMessage.getChatRoomId()));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found with ID: " + senderId));

        if (!chatRoomService.isUserParticipant(chatRoom.getId(), sender.getId())) {
            throw new AccessDeniedException("User is not a participant of this chat room.");
        }

        Message message = new Message();
        message.setChatRoom(chatRoom);
        message.setSender(sender);
        message.setContent(newMessage.getContent());
        message.setTimestamp(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);
        log.debug("Message saved successfully with ID: {}", savedMessage.getId());
        return mapToMessageDto(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getMessagesForChatRoom(Long chatRoomId, Long requestingUserId, int page, int size) {
        log.debug("Fetching messages for chat room {} for user {} (page: {}, size: {})", chatRoomId, requestingUserId, page, size);

        // Ensure the requesting user is a participant of the chat room
        if (!chatRoomService.isUserParticipant(chatRoomId, requestingUserId)) {
            throw new AccessDeniedException("User is not a participant of this chat room.");
        }

        // Fetch messages with pagination and sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").ascending());
        List<Message> messages = messageRepository.findByChatRoomIdOrderByTimestampAsc(chatRoomId, pageable);

        return messages.stream()
                .map(this::mapToMessageDto)
                .collect(Collectors.toList());
    }

    // Helper method to convert Message entity to DTO
    public MessageDto mapToMessageDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setChatRoomId(message.getChatRoom().getId());
        dto.setSender(userService.mapToUserDto(message.getSender()));
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        return dto;
    }
}