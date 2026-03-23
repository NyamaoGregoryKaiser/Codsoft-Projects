import React from 'react';
import moment from 'moment';
import '../../styles/MessageDisplay.css'; // Assume a separate CSS for MessageDisplay

const MessageDisplay = ({ message, isOwnMessage }) => {
  const messageClass = isOwnMessage ? 'own-message' : 'other-message';
  const timestamp = moment(message.timestamp).format('MMM D, h:mm A');

  return (
    <div className={`message-bubble ${messageClass}`}>
      {!isOwnMessage && <div className="message-sender">{message.sender.username}</div>}
      <div className="message-content">{message.content}</div>
      <div className="message-timestamp">{timestamp}</div>
    </div>
  );
};

export default MessageDisplay;