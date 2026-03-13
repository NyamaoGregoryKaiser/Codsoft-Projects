```typescript
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  error?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`form-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Input;
```