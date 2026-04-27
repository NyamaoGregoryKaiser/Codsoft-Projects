import React, { useState } from 'react';
import { Room, User, RoomType } from '../../types';

interface SidebarProps {
  user: User | null;
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onCreateRoom: (name: string, type: RoomType) => void;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  rooms,
  selectedRoom,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  onLogout,
}) => {
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>(RoomType.PUBLIC);
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim(), newRoomType);
      setNewRoomName('');
    }
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      onJoinRoom(joinRoomId.trim());
      setJoinRoomId('');
    }
  };

  return (
    <div className="flex w-80 flex-col border-r border-gray-700 bg-gray-800 p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Chat Rooms</h1>
        <button
          onClick={onLogout}
          className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {user && (
        <div className="mb-6 border-b border-gray-700 pb-4 text-center">
          <img
            src={user.avatar || '/images/default-avatar.png'}
            alt={user.username}
            className="mx-auto mb-2 h-16 w-16 rounded-full border-2 border-indigo-500"
          />
          <p className="text-lg font-semibold text-white">{user.username}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      )}

      {/* Create Room Section */}
      <div className="mb-6 border-b border-gray-700 pb-4">
        <h3 className="mb-2 text-lg font-semibold text-white">Create New Room</h3>
        <input
          type="text"
          placeholder="Room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          className="mb-2 w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
        <select
          value={newRoomType}
          onChange={(e) => setNewRoomType(e.target.value as RoomType)}
          className="mb-2 w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white focus:border-indigo-500 focus:ring-indigo-500"
        >
          {Object.values(RoomType).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreateRoom}
          className="w-full rounded-lg bg-green-600 py-2 text-white hover:bg-green-700"
        >
          Create Room
        </button>
      </div>

      {/* Join Room Section */}
      <div className="mb-6 border-b border-gray-700 pb-4">
        <h3 className="mb-2 text-lg font-semibold text-white">Join Room by ID</h3>
        <input
          type="text"
          placeholder="Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="mb-2 w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
        <button
          onClick={handleJoinRoom}
          className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
        >
          Join Room
        </button>
      </div>


      <h3 className="mb-4 text-lg font-semibold text-white">Your Rooms</h3>
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <p className="text-gray-400">You are not a member of any rooms yet.</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`mb-2 w-full rounded-lg p-3 text-left hover:bg-gray-700 ${
                selectedRoom?.id === room.id ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700'
              }`}
            >
              <h4 className="font-semibold text-white">{room.name}</h4>
              <p className="text-sm text-gray-400">
                {room.type === RoomType.DIRECT ? 'Direct Message' : 'Group Chat'}
              </p>
              {/* Add unread message indicator here */}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;