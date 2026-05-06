```javascript
import React from 'react';

const Alert = ({ message, type = 'info' }) => {
  let bgColorClass;
  let textColorClass;
  switch (type) {
    case 'success':
      bgColorClass = 'bg-green-100';
      textColorClass = 'text-green-800';
      break;
    case 'error':
      bgColorClass = 'bg-red-100';
      textColorClass = 'text-red-800';
      break;
    case 'warning':
      bgColorClass = 'bg-yellow-100';
      textColorClass = 'text-yellow-800';
      break;
    case 'info':
    default:
      bgColorClass = 'bg-blue-100';
      textColorClass = 'text-blue-800';
      break;
  }

  return (
    <div className={`p-4 rounded-md ${bgColorClass}`}>
      <p className={`text-sm font-medium ${textColorClass}`}>{message}</p>
    </div>
  );
};

export default Alert;
```