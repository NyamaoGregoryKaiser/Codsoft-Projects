import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) => {
  const baseClasses = 'focus:outline-none focus:ring-2 focus:ring-offset-2';
  let variantClasses;

  switch (variant) {
    case 'secondary':
      variantClasses = 'button-secondary';
      break;
    case 'danger':
      variantClasses = 'button-danger';
      break;
    case 'primary':
    default:
      variantClasses = 'button-primary';
      break;
  }

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
```
**`frontend/src/components/InputField.js`**
```javascript