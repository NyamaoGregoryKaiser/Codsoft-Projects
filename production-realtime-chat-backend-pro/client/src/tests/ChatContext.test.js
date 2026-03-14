```javascript
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ChatProvider, ChatContext } from '../contexts/ChatContext';
import { SocketContext } from '../contexts/SocketContext';
import { AuthContext } from '../contexts/AuthContext';
import API from '../api/api';

// Mock API
jest.mock('../api/api');

// Mock socket.io-client to control socket events
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  id: 'mock-socket-id',
};

// Mock AuthContext values
const mockAuthContextValue = {
  isAuthenticated: true,
  user: { _id: 'user1', username: 'TestUser' },
  loading: false,
};

// Mock SocketContext values
const mockSocketContextValue = {
  socket: mockSocket,
  loading: false,
};

const TestComponent = () => {
  const {
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    onlineUsers,
    typingUsers,
    loadingRooms,
    loadingMessages,
    hasMoreMessages,
    fetchMessages,
  } = React.useContext(ChatContext);

  if (loadingRooms) return <div>Loading Rooms...</div>;
  if (loadingMessages) return <div>Loading Messages...</div>;

  return (
    <div>
      <span data-testid="current-room">{currentRoom ? currentRoom.name : 'No room selected'}</span>
      <button onClick={() => setCurrentRoom({ _id: 'room1', name: 'General', isPrivate: false })}>
        Select Room 1
      </button>
      <div data-testid="online-users">{Object.keys(onlineUsers).length} online users</div>
      <div data-testid="typing-users">{Object.keys(typingUsers).length} typing rooms</div>
      <div data-testid="messages-count">{messages[currentRoom?._id]?.length || 0} messages</div>
      <div data-testid="has-more-messages">
        {hasMoreMessages[currentRoom?._id] ? 'Has More' : 'No More'}
      </div>
      <button onClick={() => fetchMessages(currentRoom?._id)}>Fetch More Messages</button>
    </div>
  );
};

describe('ChatContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock API calls
    API.get.mockImplementation((url) => {
      if (url.includes('/rooms')) {
        return Promise.resolve({ data: { data: [{ _id: 'room1', name: 'General', isPrivate: false }] } });
      }
      if (url.includes('/messages/room1')) {
        return Promise.resolve({ data: { data: [{ _id: 'msg1', room: 'room1', content: 'Hi' }] } });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  const renderChatProvider = (authValue = mockAuthContextValue, socketValue = mockSocketContextValue) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <SocketContext.Provider value={socketValue}>
          <ChatProvider>
            <TestComponent />
          </ChatProvider>
        </SocketContext.Provider>
      </AuthContext.Provider>
    );
  };

  it('should fetch rooms on initial load if authenticated', async () => {
    renderChatProvider();
    expect(screen.getByText('Loading Rooms...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('current-room')).toHaveTextContent('General');
    });
    expect(API.get).toHaveBeenCalledWith('/rooms');
  });

  it('should set currentRoom to the first room fetched if none selected', async () => {
    renderChatProvider();
    await waitFor(() => {
      expect(screen.getByTestId('current-room')).toHaveTextContent('General');
    });
  });

  it('should fetch messages when current room changes', async () => {
    renderChatProvider();
    await waitFor(() => expect(screen.getByTestId('current-room')).toHaveTextContent('General')); // Initial room load

    act(() => {
      // Simulate switching to the same room or a different room
      // For this test, it will re-fetch as `currentRoom` is explicitly set,
      // and our `useEffect` for `currentRoom` correctly triggers.
      screen.getByText('Select Room 1').click();
    });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/messages/room1?page=1&limit=50'); // Initial fetch for room1 (page 1)
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
    });
  });

  it('should handle "receiveMessage" socket event', async () => {
    renderChatProvider();
    await waitFor(() => expect(screen.getByTestId('current-room')).toHaveTextContent('General'));

    // Simulate selecting the room so messages are loaded
    act(() => {
      screen.getByText('Select Room 1').click();
    });
    await waitFor(() => expect(screen.getByTestId('messages-count')).toHaveTextContent('1'));

    const newMessage = { _id: 'msg2', room: 'room1', content: 'Hello', sender: { _id: 'user2', username: 'OtherUser' } };
    act(() => {
      mockSocket.on.mock.calls.find(call => call[0] === 'receiveMessage')[1](newMessage);
    });

    await waitFor(() => {
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
    });
  });

  it('should handle "user:online" and "user:offline" events', async () => {
    renderChatProvider();
    await waitFor(() => expect(screen.getByTestId('current-room')).toHaveTextContent('General'));

    // Simulate initial online users
    act(() => {
      mockSocket.on.mock.calls.find(call => call[0] === 'users:online:initial')[1]({ 'user1': 'TestUser', 'user3': 'NewOnline' });
    });
    await waitFor(() => {
      expect(screen.getByTestId('online-users')).toHaveTextContent('2 online users');
    });

    // Simulate new user online
    act(() => {
      mockSocket.on.mock.calls.find(call => call[0] === 'user:online')[1]({ userId: 'user4', username: 'AnotherUser' });
    });
    await waitFor(() => {
      expect(screen.getByTestId('online-users')).toHaveTextContent('3 online users');
    });

    // Simulate user offline
    act(() => {
      mockSocket.on.mock.calls.find(call => call[0] === 'user:offline')[1]({ userId: 'user3' });
    });
    await waitFor(() => {
      expect(screen.getByTestId('online-users')).toHaveTextContent('2 online users');
    });
  });

  it('should handle "typing" and "stopTyping" events', async () => {
    renderChatProvider();
    await waitFor(() => expect(screen.getByTestId('current-room')).toHaveTextContent('General'));

    // Simulate user typing (for a different user than the current authenticated one)
    act(() => {
      mockSocket.on.mock.calls.find(call => call[0] === 'typing')[1]({ roomId: 'room1', userId: 'user2', username: 'OtherUser' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('typing-users')).toHaveTextContent('1 typing rooms');
    });

    // Simulate user stops typing
    act(() => {
      mockSocket.on.mock.calls.find(call => call[0] === 'stopTyping')[1]({ roomId: 'room1', userId: 'user2' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('typing-users')).toHaveTextContent('0 typing rooms');
    });
  });

  it('should call fetchMessages for pagination when "Fetch More Messages" is clicked', async () => {
    API.get.mockImplementationOnce((url) => {
      if (url.includes('/messages/room1?page=1')) {
        return Promise.resolve({ data: { data: [{ _id: 'msg1', room: 'room1', content: 'Hi' }] } });
      }
      if (url.includes('/messages/room1?page=2')) {
        return Promise.resolve({ data: { data: [{ _id: 'msg0', room: 'room1', content: 'Old message' }] } });
      }
      return Promise.reject(new Error('Not Found'));
    });

    renderChatProvider();
    await waitFor(() => expect(screen.getByTestId('current-room')).toHaveTextContent('General')); // Initial load and fetch
    await waitFor(() => expect(screen.getByTestId('messages-count')).toHaveTextContent('1'));


    act(() => {
      screen.getByText('Fetch More Messages').click();
    });

    expect(screen.getByText('Loading Messages...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
    });
    expect(API.get).toHaveBeenCalledWith('/messages/room1?page=2&limit=50');
  });

  it('should reset chat state on logout', async () => {
    renderChatProvider();
    await waitFor(() => expect(screen.getByTestId('current-room')).toHaveTextContent('General'));

    // Simulate logout
    const unauthenticatedAuth = { ...mockAuthContextValue, isAuthenticated: false, user: null };
    const { rerender } = renderChatProvider(unauthenticatedAuth); // Re-render with unauthenticated context

    await waitFor(() => {
      expect(screen.getByTestId('current-room')).toHaveTextContent('No room selected');
      expect(screen.getByTestId('online-users')).toHaveTextContent('0 online users');
      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
    });
  });
});
```