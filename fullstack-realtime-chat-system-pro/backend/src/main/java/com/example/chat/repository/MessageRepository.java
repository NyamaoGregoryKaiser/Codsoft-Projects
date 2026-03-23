package com.example.chat.repository;

import com.example.chat.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    // Find messages for a specific chat room, ordered by timestamp, with pagination
    List<Message> findByChatRoomIdOrderByTimestampAsc(Long chatRoomId, Pageable pageable);

    // Get the latest N messages for a chat room
    List<Message> findByChatRoomIdOrderByTimestampDesc(Long chatRoomId, Pageable pageable);
}