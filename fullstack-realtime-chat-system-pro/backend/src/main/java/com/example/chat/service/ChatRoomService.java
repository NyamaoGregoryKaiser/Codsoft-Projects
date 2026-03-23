package com.example.chat.service;

import com.example.chat.dto.ChatRoomCreationDto;
import com.example.chat.dto.ChatRoomDto;
import com.example.chat.dto.UserDto;
import com.example.chat.entity.ChatRoom;
import com.example.chat.entity.ChatRoomParticipant;
import com.example.chat.entity.User;
import com.example.chat.exception.ResourceNotFoundException;
import com.example.chat.exception.ValidationException;
import com.example.chat.repository.ChatRoomParticipantRepository;
import com.example.chat.repository.ChatRoomRepository;
import com.example.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatRoomParticipantRepository chatRoomParticipantRepository;
    private final UserService userService; // Use userService to map User to UserDto

    @Transactional
    @CacheEvict(value = {"chatRooms", "users"}, allEntries = true) // Clear caches that might contain chat room lists or user data linked to rooms
    public ChatRoomDto createChatRoom(ChatRoomCreationDto creationDto, Long creatorId) {
        log.info("Creating new chat room: {} by user ID: {}", creationDto.getName(), creatorId);

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found with ID: " + creatorId));

        if (chatRoomRepository.findByName(creationDto.getName()).isPresent()) {
            throw new ValidationException("Chat room with this name already exists.");
        }

        ChatRoom chatRoom = new ChatRoom();
        chatRoom.setName(creationDto.getName());
        chatRoom.setDescription(creationDto.getDescription());
        chatRoom.setCreator(creator);
        chatRoom.setCreatedAt(LocalDateTime.now());
        chatRoom.setUpdatedAt(LocalDateTime.now());

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);

        // Automatically add the creator as a participant
        ChatRoomParticipant creatorParticipant = new ChatRoomParticipant(creator, savedChatRoom);
        chatRoomParticipantRepository.save(creatorParticipant);
        savedChatRoom.getParticipants().add(creatorParticipant); // Update the entity's collection
        creator.getChatRoomParticipants().add(creatorParticipant); // Update user's collection too

        log.info("Chat room '{}' created successfully with ID: {}", savedChatRoom.getName(), savedChatRoom.getId());
        return mapToChatRoomDto(savedChatRoom);
    }

    @Transactional
    @CacheEvict(value = {"chatRooms", "users"}, key = "#chatRoomId") // Evict specific chat room cache on update/add participant
    public ChatRoomDto addParticipantToChatRoom(Long chatRoomId, Long userId) {
        log.info("Adding user ID {} to chat room ID {}", userId, chatRoomId);

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with ID: " + chatRoomId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (chatRoomParticipantRepository.existsByChatRoomIdAndUserId(chatRoomId, userId)) {
            throw new ValidationException("User is already a participant in this chat room.");
        }

        ChatRoomParticipant participant = new ChatRoomParticipant(user, chatRoom);
        chatRoomParticipantRepository.save(participant);

        // Update the entity collections manually if not transactional, or rely on Hibernate's dirty checking
        chatRoom.getParticipants().add(participant);
        user.getChatRoomParticipants().add(participant);
        userRepository.save(user); // Persist changes to user's participants collection
        chatRoomRepository.save(chatRoom); // Persist changes to chatroom's participants collection

        log.info("User {} added to chat room {}", user.getUsername(), chatRoom.getName());
        return mapToChatRoomDto(chatRoom);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "chatRooms", key = "#chatRoomId")
    public Optional<ChatRoomDto> getChatRoomById(Long chatRoomId) {
        log.debug("Fetching chat room by ID: {}", chatRoomId);
        return chatRoomRepository.findById(chatRoomId).map(this::mapToChatRoomDto);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "chatRooms", key = "'allUserRooms:' + #userId")
    public List<ChatRoomDto> getChatRoomsByUserId(Long userId) {
        log.debug("Fetching chat rooms for user ID: {}", userId);
        return chatRoomRepository.findChatRoomsByUserId(userId).stream()
                .map(this::mapToChatRoomDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isUserParticipant(Long chatRoomId, Long userId) {
        return chatRoomRepository.isUserParticipant(chatRoomId, userId);
    }

    // Helper method to convert ChatRoom entity to DTO
    public ChatRoomDto mapToChatRoomDto(ChatRoom chatRoom) {
        ChatRoomDto dto = new ChatRoomDto();
        dto.setId(chatRoom.getId());
        dto.setName(chatRoom.getName());
        dto.setDescription(chatRoom.getDescription());
        dto.setCreator(userService.mapToUserDto(chatRoom.getCreator()));
        dto.setCreatedAt(chatRoom.getCreatedAt());

        // Map participants
        Set<UserDto> participants = chatRoom.getParticipants().stream()
                .map(ChatRoomParticipant::getUser)
                .map(userService::mapToUserDto)
                .collect(Collectors.toSet());
        dto.setParticipants(participants);

        // Latest messages can be fetched separately if needed, for simplicity let's omit or get a few
        // For a full chat room view, messages are usually fetched via a dedicated endpoint with pagination.
        // We'll leave this empty for now or fetch very few as an example.
        // dto.setLatestMessages(chatRoom.getMessages().stream().limit(5).map(messageService::mapToMessageDto).collect(Collectors.toSet()));

        return dto;
    }
}