package com.example.chat.repository;

import com.example.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // Find chat rooms where a specific user is a participant
    @Query("SELECT cr FROM ChatRoom cr JOIN cr.participants p WHERE p.user.id = :userId")
    List<ChatRoom> findChatRoomsByUserId(Long userId);

    // Find a chat room by its name
    Optional<ChatRoom> findByName(String name);

    // Check if a user is a participant of a given chat room
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN TRUE ELSE FALSE END FROM ChatRoom cr JOIN cr.participants p WHERE cr.id = :chatRoomId AND p.user.id = :userId")
    boolean isUserParticipant(Long chatRoomId, Long userId);
}