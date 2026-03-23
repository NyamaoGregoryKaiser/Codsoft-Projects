package com.example.chat.repository;

import com.example.chat.entity.ChatRoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomParticipantRepository extends JpaRepository<ChatRoomParticipant, Long> {
    Optional<ChatRoomParticipant> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);
}