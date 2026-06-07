```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { ChatRoom, User } from '../types';
import { fetchUserChatRooms, createChatRoom, addChatRoomMember, fetchUsers } from '../api/chat';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface ChatListProps {
  onSelectChat: (chatRoomId: number) => void;
  selectedChatId: number | null;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatName, setNewChatName] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth(); // Get current user from AuthContext

  const loadChatRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rooms = await fetchUserChatRooms();
      setChatRooms(rooms);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load chat rooms');
      console.error('Failed to load chat rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers.filter(u => u.id !== currentUser?.id)); // Exclude current user from list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
      console.error('Failed to load users:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;

    try {
      const newRoom = await createChatRoom(newChatName);
      // Add selected users to the new chat room
      for (const userId of selectedUsers) {
        await addChatRoomMember(newRoom.id, userId);
      }
      loadChatRooms(); // Reload chat rooms to include the new one
      setShowNewChatModal(false);
      setNewChatName('');
      setSelectedUsers([]);
      onSelectChat(newRoom.id); // Automatically select the new chat
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create chat room');
      console.error('Failed to create chat room:', err);
    }
  };

  const openNewChatModal = () => {
    loadUsers(); // Load users when opening the modal
    setShowNewChatModal(true);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading chats...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">Error: {error}</div>
    );
  }

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
        <button
          onClick={openNewChatModal}
          className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Create new chat"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chatRooms.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No chat rooms yet. Start one!</p>
        ) : (
          chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectChat(room.id)}
              className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 ${
                selectedChatId === room.id ? 'bg-indigo-100' : ''
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900">{room.name}</p>
                {/* <p className="text-sm text-gray-500">Last message preview...</p> */}
              </div>
            </div>
          ))
        )}
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Chat Room</h3>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Chat Room Name"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Members:</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {users.length === 0 ? (
                  <p className="text-gray-500">No other users available.</p>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`user-${u.id}`}
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, u.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== u.id));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={`user-${u.id}`} className="ml-2 text-sm text-gray-700">
                        {u.username} ({u.email})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowNewChatModal(false); setNewChatName(''); setSelectedUsers([]); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={!newChatName.trim()}
              >
                Create
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
```