'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socket';
import { Room, Message, User, RoomType } from '../../types';
import MessageInput from '../../components/chat/MessageInput';
import MessageList from '../../components/chat/MessageList';
import Sidebar from '../../components/chat/Sidebar';
import RoomHeader from '../../components/chat/RoomHeader';
import { ChatService } from '../../services/api'; // For REST calls like getting rooms
import { format } from 'date-fns';

export default function ChatPage() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null); // userId of who is typing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // For infinite scroll
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // To prevent multiple loads

  const MESSAGES_PER_LOAD = 50;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/'); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found for socket connection.');
      logout();
      return;
    }

    // Initialize socket connection
    socketService.connect(token);

    const socket = socketService.getSocket();

    socket.on('connect', () => {
      console.log('Socket Connected!');
      setConnected(true);
      // Fetch initial rooms when connected
      fetchUserRooms();
    });

    socket.on('disconnect', () => {
      console.log('Socket Disconnected!');
      setConnected(false);
    });

    socket.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      if (selectedRoom?.id === message.roomId) {
        setMessages((prevMessages) => [message, ...prevMessages]);
      }
      // Also update room list for unread counts or last message preview
      // (Simplified: in a real app, you'd update room.lastMessage and room.unreadCount)
    });

    socket.on('roomCreated', (room: Room) => {
      console.log('Room created:', room);
      setRooms((prevRooms) => [...prevRooms, room]);
    });

    socket.on('userJoinedRoom', ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      console.log(`User ${username} joined room ${roomId}`);
      if (selectedRoom?.id === roomId) {
        setMessages((prev) => [{
          id: `system-${Date.now()}`,
          sender: { id: 'system', username: 'System' } as User,
          content: `${username} joined the room.`,
          timestamp: new Date().toISOString(),
          type: 'system',
          roomId: roomId,
        }, ...prev]);
      }
      // Update room members list in UI if currently viewing that room
    });

    socket.on('userLeftRoom', ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      console.log(`User ${username} left room ${roomId}`);
      if (selectedRoom?.id === roomId) {
        setMessages((prev) => [{
          id: `system-${Date.now()}`,
          sender: { id: 'system', username: 'System' } as User,
          content: `${username} left the room.`,
          timestamp: new Date().toISOString(),
          type: 'system',
          roomId: roomId,
        }, ...prev]);
      }
    });

    socket.on('typing', ({ roomId, userId, username }: { roomId: string; userId: string; username: string }) => {
      if (selectedRoom?.id === roomId && userId !== user.id) {
        setIsTyping(username);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(null);
        }, 3000); // Stop typing indicator after 3 seconds
      }
    });

    socket.on('exception', (error: any) => {
      console.error('WebSocket Error:', error);
      alert(`Chat Error: ${error.message || 'An unknown error occurred'}`);
    });

    return () => {
      socketService.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user, selectedRoom, logout]); // Re-run if auth state or selected room changes

  const fetchUserRooms = useCallback(async () => {
    try {
      const fetchedRooms = await ChatService.getUserRooms();
      setRooms(fetchedRooms);
      if (fetchedRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(fetchedRooms[0]); // Auto-select the first room
      }
    } catch (error) {
      console.error('Failed to fetch user rooms:', error);
      alert('Failed to load chat rooms.');
    }
  }, [selectedRoom]); // Only runs once on mount

  const fetchRoomMessages = useCallback(async (roomId: string, offset: number) => {
    if (isLoadingMessages || !hasMoreMessages && offset > 0) return; // Prevent double fetching or fetching beyond end

    setIsLoadingMessages(true);
    try {
      const socket = socketService.getSocket();
      socket.emit('getRoomMessages', { roomId, limit: MESSAGES_PER_LOAD, offset }, (response: any) => {
        if (response.data && Array.isArray(response.data.messages)) {
          const newMessages = response.data.messages.reverse(); // Reverse to display chronologically
          setMessages((prevMessages) => {
            if (offset === 0) return newMessages; // First load
            return [...newMessages, ...prevMessages]; // Append older messages
          });
          setHasMoreMessages(newMessages.length === MESSAGES_PER_LOAD);
        } else {
          setHasMoreMessages(false);
        }
      });
    } catch (error) {
      console.error('Failed to fetch room messages:', error);
      setHasMoreMessages(false); // Assume no more messages on error
    } finally {
      setIsLoadingMessages(false);
    }
  }, [hasMoreMessages, isLoadingMessages]);

  useEffect(() => {
    if (selectedRoom) {
      console.log('Selected room changed to:', selectedRoom.id);
      setMessages([]); // Clear messages when room changes
      setHasMoreMessages(true); // Reset pagination for new room
      fetchRoomMessages(selectedRoom.id, 0); // Fetch initial messages for the new room
    }
  }, [selectedRoom, fetchRoomMessages]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedRoom || !connected) return;

    try {
      const socket = socketService.getSocket();
      socket.emit('sendMessage', { roomId: selectedRoom.id, content, type: 'text' });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    }
  }, [selectedRoom, connected]);

  const handleCreateRoom = useCallback(async (name: string, type: RoomType) => {
    if (!connected) return;
    try {
      const socket = socketService.getSocket();
      socket.emit('createRoom', { name, type }, (response: any) => {
        if (response.data?.success) {
          console.log('Room created successfully with ID:', response.data.roomId);
          // The 'roomCreated' event listener will update `rooms` state
        } else {
          console.error('Failed to create room:', response);
          alert('Failed to create room.');
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room.');
    }
  }, [connected]);

  const handleJoinRoom = useCallback(async (roomId: string) => {
    if (!connected) return;
    try {
      const socket = socketService.getSocket();
      socket.emit('joinRoom', { roomId }, (response: any) => {
        if (response.data?.success) {
          console.log('Joined room successfully:', roomId);
          // Refetch user rooms to update the sidebar, or add room manually
          fetchUserRooms();
        } else {
          console.error('Failed to join room:', response);
          alert('Failed to join room.');
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room.');
    }
  }, [connected, fetchUserRooms]);

  const handleLoadMoreMessages = useCallback(() => {
    if (selectedRoom && hasMoreMessages && !isLoadingMessages) {
      fetchRoomMessages(selectedRoom.id, messages.length);
    }
  }, [selectedRoom, hasMoreMessages, isLoadingMessages, messages.length, fetchRoomMessages]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-white">
      <Sidebar
        user={user}
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLogout={logout}
      />

      <div className="flex flex-1 flex-col">
        {selectedRoom ? (
          <>
            <RoomHeader room={selectedRoom} />
            <MessageList
              messages={messages}
              currentUser={user}
              onLoadMore={handleLoadMoreMessages}
              hasMore={hasMoreMessages}
              isLoading={isLoadingMessages}
            />
            <div className="p-4">
              {isTyping && <p className="text-sm text-gray-400">{isTyping} is typing...</p>}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTypingStart={() => socketService.getSocket()?.emit('typing', { roomId: selectedRoom.id })}
                onTypingEnd={() => { /* Not strictly needed to emit end, timeout handles it */ }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Select a room or create a new one to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}