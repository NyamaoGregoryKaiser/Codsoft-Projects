```typescript
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-8">
      <div className="container text-center">
        <p>&copy; {new Date().getFullYear()} ProjectFlow. All rights reserved.</p>
        <p className="text-sm mt-2">Built with ❤️ for DevOps Automation.</p>
      </div>
    </footer>
  );
};

export default Footer;
```