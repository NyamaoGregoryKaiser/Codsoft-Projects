```javascript
/**
 * @file Displays a list of chat rooms and allows selection.
 * @module components/RoomList
 */

import React, { useState } from 'react';
import './RoomList.css';
import useAuth from '../hooks/useAuth';

const RoomList = ({ rooms, selectedRoom, onSelectRoom, onCreateRoom, onJoinRoom, onLeaveRoom, isLoading }) => {
    const { user } = useAuth();
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDescription, setNewRoomDescription] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [newRoomError, setNewRoomError] = useState(null);

    const handleCreateRoomSubmit = async (e) => {
        e.preventDefault();
        if (newRoomName.trim()) {
            setIsCreatingRoom(true);
            setNewRoomError(null);
            try {
                await onCreateRoom({ name: newRoomName.trim(), description: newRoomDescription.trim() });
                setNewRoomName('');
                setNewRoomDescription('');
            } catch (err) {
                setNewRoomError(err.response?.data?.message || 'Failed to create room.');
            } finally {
                setIsCreatingRoom(false);
            }
        }
    };

    const isMemberOfRoom = (room) => {
        return room.members && room.members.some(member => member.id === user.id);
    };

    return (
        <div className="room-list-container">
            <h3>Rooms</h3>
            <form onSubmit={handleCreateRoomSubmit} className="create-room-form">
                <input
                    type="text"
                    placeholder="New room name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    disabled={isCreatingRoom}
                />
                <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    disabled={isCreatingRoom}
                />
                <button type="submit" disabled={!newRoomName.trim() || isCreatingRoom}>
                    {isCreatingRoom ? 'Creating...' : 'Create Room'}
                </button>
                {newRoomError && <p className="error-message small">{newRoomError}</p>}
            </form>

            {isLoading ? (
                <p>Loading rooms...</p>
            ) : (
                <ul className="room-list">
                    {rooms.length === 0 && <p className="no-rooms">No rooms available. Create one!</p>}
                    {rooms.map((room) => (
                        <li
                            key={room.id}
                            className={`room-item ${selectedRoom && selectedRoom.id === room.id ? 'active' : ''}`}
                        >
                            <div className="room-info" onClick={() => onSelectRoom(room)}>
                                <h4>{room.name}</h4>
                                <p>{room.description}</p>
                            </div>
                            <div className="room-actions">
                                {isMemberOfRoom(room) ? (
                                    <button
                                        onClick={() => onLeaveRoom(room.id)}
                                        className="leave-button"
                                        disabled={isLoading}
                                    >
                                        Leave
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onJoinRoom(room.id)}
                                        className="join-button"
                                        disabled={isLoading}
                                    >
                                        Join
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RoomList;
```