```javascript
/**
 * @file Custom React hook for chat room and message management, integrating with Socket.IO.
 * @module hooks/useChat
 */

import { useState, useEffect, useCallback } from 'react';
import { getRooms, getRoomMessages, joinRoom, leaveRoom, createRoom as apiCreateRoom } from '../api/chatApi';
import useAuth from './useAuth';

const useChat = () => {
    const { socket, user } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState(null);

    const fetchRooms = useCallback(async () => {
        setLoadingRooms(true);
        setError(null);
        try {
            const data = await getRooms();
            setRooms(data);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
            setError(err.response?.data?.message || 'Failed to load rooms.');
        } finally {
            setLoadingRooms(false);
        }
    }, []);

    const fetchMessages = useCallback(async (roomId) => {
        setLoadingMessages(true);
        setError(null);
        try {
            const data = await getRoomMessages(roomId);
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setError(err.response?.data?.message || 'Failed to load messages.');
            setMessages([]); // Clear messages on error
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // Effect for initial room fetch and Socket.IO listeners
    useEffect(() => {
        if (user) {
            fetchRooms();
        }

        if (socket) {
            // Socket.IO listeners for real-time updates
            socket.on('chat:message', (message) => {
                // console.log('Received real-time message:', message);
                if (selectedRoom && message.roomId === selectedRoom.id) {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            });

            socket.on('room:new', (newRoom) => {
                // console.log('Received new room:', newRoom);
                setRooms((prevRooms) => [...prevRooms, newRoom]);
            });

            socket.on('room:update', (updatedRoom) => {
                // console.log('Received room update:', updatedRoom);
                setRooms((prevRooms) => prevRooms.map(room => room.id === updatedRoom.id ? updatedRoom : room));
                if (selectedRoom && selectedRoom.id === updatedRoom.id) {
                    setSelectedRoom(updatedRoom);
                }
            });

            socket.on('room:delete', ({ roomId }) => {
                // console.log('Received room delete:', roomId);
                setRooms((prevRooms) => prevRooms.filter(room => room.id !== roomId));
                if (selectedRoom && selectedRoom.id === roomId) {
                    setSelectedRoom(null);
                    setMessages([]);
                }
            });

            socket.on('room:user:join', (data) => {
                // console.log('User joined room:', data);
                setRooms(prevRooms => prevRooms.map(room => {
                    if (room.id === data.roomId && !room.members.some(m => m.id === data.userId)) {
                        return { ...room, members: [...room.members, { id: data.userId, username: data.username, status: 'online' }] }; // Assume online for new joiners
                    }
                    return room;
                }));
            });

            socket.on('room:user:leave', (data) => {
                // console.log('User left room:', data);
                setRooms(prevRooms => prevRooms.map(room => {
                    if (room.id === data.roomId) {
                        return { ...room, members: room.members.filter(m => m.id !== data.userId) };
                    }
                    return room;
                }));
            });


            return () => {
                socket.off('chat:message');
                socket.off('room:new');
                socket.off('room:update');
                socket.off('room:delete');
                socket.off('room:user:join');
                socket.off('room:user:leave');
            };
        }
    }, [socket, selectedRoom, user, fetchRooms]); // Depend on socket and selectedRoom to ensure listeners are correct

    // Effect to fetch messages when selectedRoom changes
    useEffect(() => {
        if (selectedRoom) {
            fetchMessages(selectedRoom.id);
        } else {
            setMessages([]);
        }
    }, [selectedRoom, fetchMessages]);

    const handleSelectRoom = useCallback(async (room) => {
        if (selectedRoom && selectedRoom.id === room.id) return; // Prevent re-fetching if same room selected
        setSelectedRoom(room);
        // Automatically join the room when selected in UI (if not already a member)
        if (!room.members.some(member => member.id === user.id)) {
             try {
                await handleJoinRoom(room.id);
            } catch (err) {
                console.error('Failed to auto-join room on selection:', err);
                // Optionally, don't allow selecting the room if join fails
                // setSelectedRoom(null);
            }
        }
    }, [selectedRoom, user, handleJoinRoom]);

    const sendMessage = useCallback((content) => {
        if (socket && selectedRoom && content.trim()) {
            socket.emit('chat:message', { roomId: selectedRoom.id, content }, (response) => {
                if (!response.success) {
                    console.error('Error sending message via socket:', response.message);
                    setError(response.message);
                } else {
                    setError(null);
                }
            });
        }
    }, [socket, selectedRoom]);

    const handleCreateRoom = useCallback(async (roomData) => {
        setError(null);
        try {
            const data = await apiCreateRoom(roomData);
            setRooms((prev) => [...prev, data.room]); // Update local state directly as API will emit to others
            return data.room;
        } catch (err) {
            console.error('Failed to create room:', err);
            setError(err.response?.data?.message || 'Failed to create room.');
            throw err; // Re-throw to allow component to handle
        }
    }, []);

    const handleJoinRoom = useCallback(async (roomId) => {
        setError(null);
        try {
            await joinRoom(roomId);
            // Re-fetch rooms to update membership if API doesn't push
            await fetchRooms();
            // Emit via socket for real-time updates for others
            if (socket) {
                socket.emit('room:join', roomId, (response) => {
                    if (!response.success) {
                        console.error('Error emitting room:join via socket:', response.message);
                        setError(response.message);
                    }
                });
            }
            return true;
        } catch (err) {
            console.error('Failed to join room:', err);
            setError(err.response?.data?.message || 'Failed to join room.');
            throw err;
        }
    }, [fetchRooms, socket]);

    const handleLeaveRoom = useCallback(async (roomId) => {
        setError(null);
        try {
            await leaveRoom(roomId);
            await fetchRooms(); // Re-fetch rooms to update membership
            if (socket) {
                socket.emit('room:leave', roomId, (response) => {
                    if (!response.success) {
                        console.error('Error emitting room:leave via socket:', response.message);
                        setError(response.message);
                    }
                });
            }
            if (selectedRoom && selectedRoom.id === roomId) {
                setSelectedRoom(null);
            }
            return true;
        } catch (err) {
            console.error('Failed to leave room:', err);
            setError(err.response?.data?.message || 'Failed to leave room.');
            throw err;
        }
    }, [fetchRooms, socket, selectedRoom]);


    return {
        rooms,
        selectedRoom,
        messages,
        loadingRooms,
        loadingMessages,
        error,
        fetchRooms,
        handleSelectRoom,
        sendMessage,
        createRoom: handleCreateRoom,
        joinRoom: handleJoinRoom,
        leaveRoom: handleLeaveRoom,
    };
};

export default useChat;
```