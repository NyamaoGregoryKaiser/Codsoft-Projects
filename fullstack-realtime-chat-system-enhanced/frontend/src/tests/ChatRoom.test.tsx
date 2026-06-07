```typescript
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatRoom from '../components/ChatRoom';
import * as chatApi from '../api/chat';
import * as authContext from '../contexts/AuthContext';
import * as useWebSocketHook from '../hooks/useWebSocket';

// Mock API calls
jest.mock('../api/chat');
const mockFetchChatRoomDetails = chatApi.fetchChatRoomDetails as jest.Mock;
const mockFetchChatMessages = chatApi.fetchChatMessages as jest.Mock;

// Mock AuthContext
jest.mock('../contexts/AuthContext');
const mockUseAuth = authContext.useAuth as jest.Mock;

// Mock useWebSocket hook
jest.mock('../hooks/useWebSocket');
const mockUseWebSocket = useWebSocketHook.default as jest.Mock;

const mockCurrentUser = {
  id: 1,
  username: 'Alice',
  email: 'alice@example.com',
  is_active: true,
  is_admin: false,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockOtherUser = {
  id: 2,
  username: 'Bob',
  email: 'bob@example.com',
  is_active: true,
  is_admin: false,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockChatRoom = {
  id: 101,
  name: 'Test Chat Room',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  members: [mockCurrentUser, mockOtherUser],
  messages: [
    {
      id: 1,
      chat_room_id: 101,
      sender_id: mockCurrentUser.id,
      content: 'Hi everyone!',
      sender: { id: mockCurrentUser.id, username: mockCurrentUser.username },
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T10:00:00Z',
    },
    {
      id: 2,
      chat_room_id: 101,
      sender_id: mockOtherUser.id,
      content: 'Hello Alice!',
      sender: { id: mockOtherUser.id, username: mockOtherUser.username },
      created_at: '2023-01-01T10:01:00Z',
      updated_at: '2023-01-01T10:01:00Z',
    },
  ],
};

describe('ChatRoom', () => {
  let mockSendMessage: jest.Mock;
  let mockOnMessageReceived: (message: Message) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockCurrentUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });

    mockSendMessage = jest.fn();
    mockUseWebSocket.mockImplementation((url, onMessageCallback) => {
      mockOnMessageReceived = onMessageCallback; // Capture the callback
      return { sendMessage: mockSendMessage, isConnected: true, wsError: null };
    });

    mockFetchChatRoomDetails.mockResolvedValue(mockChatRoom);
    mockFetchChatMessages.mockResolvedValue(mockChatRoom.messages);
  });

  it('renders loading state initially', () => {
    mockFetchChatRoomDetails.mockReturnValueOnce(new Promise(() => {})); // Keep pending
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Tailwind spinner
  });

  it('renders chat room details and messages after loading', async () => {
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);

    await waitFor(() => expect(screen.getByText(mockChatRoom.name)).toBeInTheDocument());
    expect(screen.getByText(`${mockChatRoom.members.length} members`)).toBeInTheDocument();
    expect(screen.getByText('Hi everyone!')).toBeInTheDocument();
    expect(screen.getByText('Hello Alice!')).toBeInTheDocument();

    // Check sender display
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText(mockOtherUser.username)).toBeInTheDocument();
  });

  it('displays an error message if chat room details fail to load', async () => {
    mockFetchChatRoomDetails.mockRejectedValueOnce({ response: { data: { detail: 'Chat not found' } } });
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByText('Error: Chat not found')).toBeInTheDocument());
  });

  it('sends a message using the WebSocket hook', async () => {
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument());

    const messageInput = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    userEvent.type(messageInput, 'New test message');
    userEvent.click(sendButton);

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith({ content: 'New test message' }));
    expect(messageInput).toHaveValue(''); // Input should be cleared
  });

  it('updates messages when a new message is received via WebSocket', async () => {
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByText('Hello Alice!')).toBeInTheDocument());

    const newMessage: Message = {
      id: 3,
      chat_room_id: mockChatRoom.id,
      sender_id: mockCurrentUser.id,
      content: 'Received via WS!',
      sender: { id: mockCurrentUser.id, username: mockCurrentUser.username },
      created_at: '2023-01-01T10:02:00Z',
      updated_at: '2023-01-01T10:02:00Z',
    };

    act(() => {
      mockOnMessageReceived(newMessage);
    });

    await waitFor(() => expect(screen.getByText('Received via WS!')).toBeInTheDocument());
    expect(screen.getAllByText(/You|Bob/i).length).toBe(3); // 2 existing + 1 new (from 'You')
  });

  it('shows WebSocket connection status', async () => {
    mockUseWebSocket.mockReturnValue({ sendMessage: mockSendMessage, isConnected: false, wsError: null });
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByText('Connecting to chat...')).toBeInTheDocument());

    mockUseWebSocket.mockReturnValue({ sendMessage: mockSendMessage, isConnected: true, wsError: null });
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByText('Chat connected.')).toBeInTheDocument());

    mockUseWebSocket.mockReturnValue({ sendMessage: mockSendMessage, isConnected: false, wsError: 'Connection failed' });
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByText('WebSocket Error: Connection failed')).toBeInTheDocument());
  });

  it('disables message input when not connected', async () => {
    mockUseWebSocket.mockReturnValue({ sendMessage: mockSendMessage, isConnected: false, wsError: null });
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled());
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('does not send empty messages', async () => {
    render(<ChatRoom chatRoomId={mockChatRoom.id} />);
    await waitFor(() => expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument());

    const messageInput = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    userEvent.type(messageInput, '   '); // spaces only
    userEvent.click(sendButton);

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(messageInput).toHaveValue('   '); // Should not clear if not sent
  });
});
```