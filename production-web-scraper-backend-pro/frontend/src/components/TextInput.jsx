```javascript
import React from 'react';
import { Field, ErrorMessage } from 'formik';

const TextInput = ({ label, name, type = 'text', placeholder, rows, className = '' }) => {
  const isTextArea = type === 'textarea';
  const InputComponent = isTextArea ? 'textarea' : 'input';

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <Field
          as={InputComponent}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          rows={rows}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`}
        />
        <ErrorMessage name={name} component="div" className="mt-1 text-sm text-red-600" />
      </div>
    </div>
  );
};

export default TextInput;
```