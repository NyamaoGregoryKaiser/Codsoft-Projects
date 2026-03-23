package com.example.chat.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "chat_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Participants in this chat room
    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ChatRoomParticipant> participants = new HashSet<>();

    // Messages in this chat room
    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("timestamp ASC") // Order messages by timestamp
    private Set<Message> messages = new HashSet<>();

    public void addParticipant(User user) {
        ChatRoomParticipant participant = new ChatRoomParticipant(user, this);
        this.participants.add(participant);
        user.getChatRoomParticipants().add(participant);
    }

    public void removeParticipant(User user) {
        ChatRoomParticipant participant = new ChatRoomParticipant(user, this); // Create a transient to find in set
        this.participants.remove(participant);
        user.getChatRoomParticipants().remove(participant);
    }
}