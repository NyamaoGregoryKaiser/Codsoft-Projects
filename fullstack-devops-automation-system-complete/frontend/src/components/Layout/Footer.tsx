```typescript
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Product Catalog System. All rights reserved.</p>
        <p>Built with React, Node.js, and TypeScript.</p>
      </div>
    </footer>
  );
};

export default Footer;
```