import React from 'react';

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, required = false, error = null }) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`input ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
```
**`frontend/src/components/Spinner.js`**
```javascript