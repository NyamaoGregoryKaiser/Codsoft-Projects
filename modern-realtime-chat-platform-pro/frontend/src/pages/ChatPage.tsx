```typescript
import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import ChatLayout from '../layouts/ChatLayout';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useChatSocket } from '../hooks/useChatSocket';

function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { fetchConversations, activeConversation, setActiveConversation, addMessage, updateConversationLastMessage } = useChatStore();
  const { socket } = useChatSocket(user?.accessToken || '');

  // Fetch conversations on load
  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id);
    }
  }, [user?.id, fetchConversations]);

  // Set active conversation from URL
  useEffect(() => {
    if (conversationId && (!activeConversation || activeConversation.id !== conversationId)) {
      setActiveConversation(conversationId);
    } else if (!conversationId && activeConversation) {
      // Clear active conversation if URL changes away from a specific chat
      // This might not be desired based on UX, but good for explicit state management
      // setActiveConversation(null);
    }
  }, [conversationId, activeConversation, setActiveConversation]);

  // Socket event listeners
  useEffect(() => {
    if (socket && user) {
      const handleNewMessage = (message: any) => {
        // Only add message if it belongs to the active conversation
        if (activeConversation?.id === message.conversationId) {
          addMessage(message);
        }
        updateConversationLastMessage(message.conversationId, message);
      };

      const handleUserStatus = (data: { userId: string; status: 'online' | 'offline' }) => {
        // console.log(`User ${data.userId} is ${data.status}`);
        // Optionally update user status in conversation list or chat window
      };

      const handleConversationUpdated = (data: { conversationId: string; latestMessage?: any }) => {
        // Re-fetch or update conversation in list
        // For simplicity, just refetch all conversations for now, can be optimized
        fetchConversations(user.id);
      };

      socket.on('message', handleNewMessage);
      socket.on('user_status', handleUserStatus);
      socket.on('conversation_updated', handleConversationUpdated);

      return () => {
        socket.off('message', handleNewMessage);
        socket.off('user_status', handleUserStatus);
        socket.off('conversation_updated', handleConversationUpdated);
      };
    }
  }, [socket, user, activeConversation, addMessage, updateConversationLastMessage, fetchConversations]);

  return (
    <ChatLayout>
      <Flex h="100vh">
        <Box w={{ base: 'full', md: '300px' }} borderRight="1px" borderColor="gray.200">
          <ConversationList />
        </Box>
        <Box flex="1" p={4} display={{ base: 'none', md: 'block' }}>
          {activeConversation ? (
            <ChatWindow conversation={activeConversation} />
          ) : (
            <Flex height="100%" alignItems="center" justifyContent="center" color="gray.500">
              Select a conversation to start chatting.
            </Flex>
          )}
        </Box>
      </Flex>
    </ChatLayout>
  );
}

export default ChatPage;
```