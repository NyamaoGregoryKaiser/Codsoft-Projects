```javascript
import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const spinnerSizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-8',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${spinnerSizeClass} border-indigo-500 border-solid rounded-full animate-spin border-t-transparent`}
        role="status"
      >
        <span className="sr-only">{text}</span>
      </div>
      {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
```