package com.example.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "chat_room_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomParticipant implements Serializable {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    private LocalDateTime joinedAt = LocalDateTime.now();

    public ChatRoomParticipant(User user, ChatRoom chatRoom) {
        this.user = user;
        this.chatRoom = chatRoom;
        this.joinedAt = LocalDateTime.now();
    }

    // Override equals and hashCode for composite key
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChatRoomParticipant that = (ChatRoomParticipant) o;
        return Objects.equals(user, that.user) &&
               Objects.equals(chatRoom, that.chatRoom);
    }

    @Override
    public int hashCode() {
        return Objects.hash(user, chatRoom);
    }
}