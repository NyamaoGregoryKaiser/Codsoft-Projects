```typescript
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  creatorId: string;
  creator: {
    username: string;
  };
  memberCount?: { memberships: number }; // Prisma _count relation
  members?: User[]; // Only included in getChannelById
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
  };
  channelId: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface TypingStatus {
  channelId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}
```