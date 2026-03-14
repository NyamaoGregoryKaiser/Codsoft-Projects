```javascript
import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export const useChat = () => {
  return useContext(ChatContext);
};
```