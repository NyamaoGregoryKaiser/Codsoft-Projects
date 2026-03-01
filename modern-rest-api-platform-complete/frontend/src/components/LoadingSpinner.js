import React from 'react';

function LoadingSpinner({ size = 'h-5 w-5', color = 'text-white' }) {
  return (
    <div className={`flex items-center justify-center`}>
      <div
        className={`animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${size} ${color}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
```