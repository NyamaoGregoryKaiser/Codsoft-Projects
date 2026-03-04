```typescript
import { useState, useEffect } from 'react';
import { TypingStatus } from 'types';

// How long to display typing status after the last typing event
const TYPING_DISPLAY_DURATION = 3000; // 3 seconds

export const useTypingStatus = () => {
  // Map userId to a timestamp when they last typed
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string; timestamp: number }>>(new Map());

  // Handle incoming typing events from socket
  const handleTypingEvent = (status: TypingStatus) => {
    if (status.isTyping) {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(status.userId, { username: status.username, timestamp: Date.now() });
        return newMap;
      });
    } else {
      // User explicitly stopped typing
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(status.userId);
        return newMap;
      });
    }
  };

  useEffect(() => {
    // Periodically clean up old typing statuses
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const now = Date.now();
        newMap.forEach((info, userId) => {
          if (now - info.timestamp > TYPING_DISPLAY_DURATION) {
            newMap.delete(userId);
          }
        });
        return newMap;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // Filter out the current user from the typing list
  const getTypingUsersForDisplay = (currentUserId?: string) => {
    const users: string[] = [];
    typingUsers.forEach((info, userId) => {
      if (userId !== currentUserId) {
        users.push(info.username);
      }
    });
    return users;
  };

  return { typingUsers, handleTypingEvent, getTypingUsersForDisplay };
};
```