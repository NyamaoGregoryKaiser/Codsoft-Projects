import React from 'react';

function LoadingSpinner({ size = 'medium', color = 'indigo-500' }) {
  const spinnerSize = {
    small: 'h-5 w-5',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div
        className={`inline-block ${spinnerSize} animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-${color}`}
        role="status"
      >
        <span
          className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
        >Loading...</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
```