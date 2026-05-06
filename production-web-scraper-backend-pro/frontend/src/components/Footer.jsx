```javascript
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 py-4 mt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
        &copy; {currentYear} Web Scraping Orchestrator. All rights reserved.
      </div>
    </footer>
  );
}
```