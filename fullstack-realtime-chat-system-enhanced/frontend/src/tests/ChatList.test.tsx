```typescript
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatList from '../components/ChatList';
import * as chatApi from '../api/chat';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock API calls
jest.mock('../api/chat');
const mockFetchUserChatRooms = chatApi.fetchUserChatRooms as jest.Mock;
const mockCreateChatRoom = chatApi.createChatRoom as jest.Mock;
const mockAddChatRoomMember = chatApi.addChatRoomMember as jest.Mock;
const mockFetchUsers = chatApi.fetchUsers as jest.Mock;

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockAuthContext = useAuth as jest.Mock;

const mockChatRooms = [
  { id: 1, name: 'General Chat', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z', members: [], messages: [] },
  { id: 2, name: 'Private Chat', created_at: '2023-01-02T00:00:00Z', updated_at: '2023-01-02T00:00:00Z', members: [], messages: [] },
];

const mockUsers = [
  { id: 2, username: 'Bob', email: 'bob@example.com', is_active: true, is_admin: false, created_at: '', updated_at: '' },
  { id: 3, username: 'Charlie', email: 'charlie@example.com', is_active: true, is_admin: false, created_at: '', updated_at: '' },
];

describe('ChatList', () => {
  const onSelectChatMock = jest.fn();
  const currentUser = { id: 1, username: 'Alice', email: 'alice@example.com', is_active: true, is_admin: false, created_at: '', updated_at: '' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.mockReturnValue({
      user: currentUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });
    mockFetchUserChatRooms.mockResolvedValue(mockChatRooms);
    mockFetchUsers.mockResolvedValue(mockUsers);
  });

  const renderComponent = (props?: any) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ChatList onSelectChat={onSelectChatMock} selectedChatId={null} {...props} />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    mockFetchUserChatRooms.mockReturnValueOnce(new Promise(() => {})); // Keep pending
    renderComponent();
    expect(screen.getByText('Loading chats...')).toBeInTheDocument();
  });

  it('renders chat rooms after loading', async () => {
    renderComponent();
    await waitFor(() => expect(mockFetchUserChatRooms).toHaveBeenCalledTimes(1));
    expect(screen.getByText('General Chat')).toBeInTheDocument();
    expect(screen.getByText('Private Chat')).toBeInTheDocument();
  });

  it('calls onSelectChat when a chat room is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('General Chat')).toBeInTheDocument());

    userEvent.click(screen.getByText('General Chat'));
    expect(onSelectChatMock).toHaveBeenCalledWith(1);
  });

  it('displays an error message if chat rooms fail to load', async () => {
    mockFetchUserChatRooms.mockRejectedValueOnce({ response: { data: { detail: 'Network error' } } });
    renderComponent();
    await waitFor(() => expect(screen.getByText('Error: Network error')).toBeInTheDocument());
  });

  it('opens and closes the new chat modal', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Chats')).toBeInTheDocument());

    userEvent.click(screen.getByLabelText('Create new chat'));
    await waitFor(() => expect(screen.getByText('Create New Chat Room')).toBeInTheDocument());
    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Bob (bob@example.com)')).toBeInTheDocument();

    userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create New Chat Room')).not.toBeInTheDocument();
  });

  it('creates a new chat room and adds selected members', async () => {
    const newChatRoom = { id: 3, name: 'Test Chat', created_at: 'now', updated_at: 'now', members: [], messages: [] };
    mockCreateChatRoom.mockResolvedValue(newChatRoom);
    mockFetchUserChatRooms.mockResolvedValue([...mockChatRooms, newChatRoom]); // Simulate reload

    renderComponent();
    await waitFor(() => expect(screen.getByText('Chats')).toBeInTheDocument());

    userEvent.click(screen.getByLabelText('Create new chat'));
    await waitFor(() => expect(screen.getByText('Create New Chat Room')).toBeInTheDocument());

    userEvent.type(screen.getByPlaceholderText('Chat Room Name'), 'Test Chat');
    userEvent.click(screen.getByLabelText('Bob (bob@example.com)')); // Select Bob

    await act(async () => {
      userEvent.click(screen.getByText('Create'));
    });

    await waitFor(() => expect(mockCreateChatRoom).toHaveBeenCalledWith('Test Chat'));
    await waitFor(() => expect(mockAddChatRoomMember).toHaveBeenCalledWith(3, 2)); // new chat ID and Bob's ID
    await waitFor(() => expect(mockFetchUserChatRooms).toHaveBeenCalledTimes(2)); // Initial load + reload after creation
    expect(screen.queryByText('Create New Chat Room')).not.toBeInTheDocument();
    expect(onSelectChatMock).toHaveBeenCalledWith(3); // New chat should be selected
  });

  it('disables create button if chat name is empty', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Chats')).toBeInTheDocument());

    userEvent.click(screen.getByLabelText('Create new chat'));
    await waitFor(() => expect(screen.getByText('Create New Chat Room')).toBeInTheDocument());

    expect(screen.getByText('Create')).toBeDisabled();
    userEvent.type(screen.getByPlaceholderText('Chat Room Name'), '  '); // Only spaces
    expect(screen.getByText('Create')).toBeDisabled();
    userEvent.type(screen.getByPlaceholderText('Chat Room Name'), 'Valid Name');
    expect(screen.getByText('Create')).not.toBeDisabled();
  });

  it('filters out the current user from the add members list', async () => {
    mockFetchUsers.mockResolvedValue([
      currentUser, // Alice
      { id: 2, username: 'Bob', email: 'bob@example.com', is_active: true, is_admin: false, created_at: '', updated_at: '' },
      { id: 3, username: 'Charlie', email: 'charlie@example.com', is_active: true, is_admin: false, created_at: '', updated_at: '' },
    ]);
    renderComponent();
    await waitFor(() => expect(screen.getByText('Chats')).toBeInTheDocument());
  
    userEvent.click(screen.getByLabelText('Create new chat'));
    await waitFor(() => expect(screen.getByText('Create New Chat Room')).toBeInTheDocument());
  
    // Alice should not be in the list of users to add
    expect(screen.queryByLabelText('Alice (alice@example.com)')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Bob (bob@example.com)')).toBeInTheDocument();
    expect(screen.getByLabelText('Charlie (charlie@example.com)')).toBeInTheDocument();
  });
});
```