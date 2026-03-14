```javascript
/**
 * @file Main chat application page.
 * @module pages/ChatPage
 */

import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import RoomList from '../components/RoomList';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import UserList from '../components/UserList';
import './ChatPage.css';

const ChatPage = () => {
    const { user, logout } = useAuth();
    const {
        rooms,
        selectedRoom,
        messages,
        loadingRooms,
        loadingMessages,
        error,
        handleSelectRoom,
        sendMessage,
        createRoom,
        joinRoom,
        leaveRoom,
    } = useChat();

    useEffect(() => {
        if (error) {
            console.error("Chat Error:", error);
            // Optionally display error to user
        }
    }, [error]);

    const handleLogout = async () => {
        await logout();
    };

    if (!user) {
        return <div className="loading-state">Loading user data...</div>; // Should be prevented by ProtectedRoute
    }

    return (
        <div className="chat-page">
            <header className="chat-header">
                <h1>Real-time Chat</h1>
                <div className="user-profile">
                    <span>Welcome, {user.username} ({user.status})</span>
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </header>
            <main className="chat-main">
                <aside className="sidebar">
                    <RoomList
                        rooms={rooms}
                        selectedRoom={selectedRoom}
                        onSelectRoom={handleSelectRoom}
                        onCreateRoom={createRoom}
                        onJoinRoom={joinRoom}
                        onLeaveRoom={leaveRoom}
                        isLoading={loadingRooms}
                    />
                    <UserList />
                </aside>
                <section className="chat-section">
                    {selectedRoom ? (
                        <>
                            <div className="room-header">
                                <h2>#{selectedRoom.name}</h2>
                                <p className="room-description">{selectedRoom.description}</p>
                                <div className="room-members">
                                    Members: {selectedRoom.members?.length || 0}
                                </div>
                            </div>
                            {loadingMessages ? (
                                <div className="loading-state">Loading messages...</div>
                            ) : (
                                <ChatWindow messages={messages} currentUser={user} />
                            )}
                            <MessageInput onSendMessage={sendMessage} disabled={loadingMessages} />
                        </>
                    ) : (
                        <div className="no-room-selected">
                            <h2>Select a room to start chatting!</h2>
                            <p>Or create a new one.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ChatPage;
```