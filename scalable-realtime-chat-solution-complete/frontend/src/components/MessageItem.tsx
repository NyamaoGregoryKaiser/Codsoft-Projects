```typescript
import React, { useState } from 'react';
import moment from 'moment';
import { Message } from 'types';
import { useAuth } from 'auth/AuthContext';
import './MessageItem.css';

interface MessageItemProps {
  message: Message;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isMyMessage = user?.id === message.senderId;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleEditSave = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditedContent(message.content);
      setIsEditing(false);
    }
  };

  return (
    <div className={`message-item ${isMyMessage ? 'my-message' : ''}`}>
      <div className="message-header">
        <span className="message-sender">{message.sender.username}</span>
        <span className="message-timestamp">{moment(message.createdAt).format('MMM D, h:mm A')}</span>
      </div>
      <div className="message-content">
        {isEditing ? (
          <input
            type="text"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleKeyDown}
            className="message-edit-input"
            autoFocus
          />
        ) : (
          <span>{message.content}</span>
        )}
      </div>
      {isMyMessage && !isEditing && (
        <div className="message-actions">
          <button onClick={() => setIsEditing(true)} className="message-action-button edit">Edit</button>
          <button onClick={() => onDelete(message.id)} className="message-action-button delete">Delete</button>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
```