import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string; // Ensure id is always present for labels
}

const Input: React.FC<InputProps> = ({ label, error, id, className, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text dark:text-dark-text mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={twMerge(
          'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm',
          'bg-white dark:bg-gray-800 text-text dark:text-dark-text border-gray-300 dark:border-gray-600',
          error && 'border-danger focus:ring-danger focus:border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default Input;
```

```