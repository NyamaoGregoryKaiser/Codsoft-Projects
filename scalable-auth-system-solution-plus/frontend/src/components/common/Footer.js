import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Auth System. All rights reserved.</p>
        <p className="text-sm mt-2">Built with ❤️ for secure web applications.</p>
      </div>
    </footer>
  );
}

export default Footer;
```