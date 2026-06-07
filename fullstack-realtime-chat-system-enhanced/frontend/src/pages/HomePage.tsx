```typescript
import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import ChatRoom from '../components/ChatRoom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for Chat List */}
      <div className="w-1/4 min-w-[300px] flex flex-col border-r border-gray-200">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">ChatApp</h1>
          <div className="flex items-center">
            {user && (
              <span className="text-sm font-medium text-gray-600 mr-3 hidden md:block">
                Hello, {user.username}!
              </span>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Logout"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatList onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} />
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col h-full">
        {selectedChatId ? (
          <ChatRoom chatRoomId={selectedChatId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xl">
            Select a chat from the left to start talking!
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
```