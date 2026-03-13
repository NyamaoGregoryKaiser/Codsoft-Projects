```typescript
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  id: string;
  error?: string;
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={4}
        className={`form-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Textarea;
```