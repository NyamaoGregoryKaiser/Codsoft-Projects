```javascript
import React from 'react';
import './Alert.css';

const Alert = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className="alert-close-btn" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
```