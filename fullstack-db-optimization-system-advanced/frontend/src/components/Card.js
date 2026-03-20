import React from 'react';

const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4 text-dark">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
```

#### `frontend/src/components/Table.js`
```javascript