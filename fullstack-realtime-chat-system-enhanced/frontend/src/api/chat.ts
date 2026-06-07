```typescript
import axios from './axiosInstance';
import { ChatRoom, ChatRoomCreate, Message, User } from '../types';

export const fetchUserChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await axios.get<ChatRoom[]>('/chats/');
  return response.data;
};

export const fetchChatRoomDetails = async (chatRoomId: number): Promise<ChatRoom> => {
  const response = await axios.get<ChatRoom>(`/chats/${chatRoomId}`);
  return response.data;
};

export const createChatRoom = async (name: string): Promise<ChatRoom> => {
  const response = await axios.post<ChatRoom>('/chats/', { name });
  return response.data;
};

export const addChatRoomMember = async (chatRoomId: number, userId: number): Promise<void> => {
  await axios.post(`/chats/${chatRoomId}/members/${userId}`);
};

export const fetchUsers = async (): Promise<User[]> => {
  const response = await axios.get<User[]>('/users/');
  return response.data;
};

export const sendChatMessage = async (chatRoomId: number, content: string): Promise<Message> => {
  const response = await axios.post<Message>(`/chats/${chatRoomId}/messages`, { content });
  return response.data;
};

export const fetchChatMessages = async (chatRoomId: number, skip: number = 0, limit: number = 50): Promise<Message[]> => {
  const response = await axios.get<Message[]>(`/chats/${chatRoomId}/messages`, {
    params: { skip, limit }
  });
  return response.data;
};
```