```typescript
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  id: string;
  options: { value: string; label: string }[];
  error?: string;
  className?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, options, error, className, placeholder, ...props }) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`form-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className || ''}`}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Select;
```