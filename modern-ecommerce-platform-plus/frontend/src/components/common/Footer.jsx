import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} E-Shop. All rights reserved.</p>
        <p>Built with ❤️ by AI Developer</p>
      </div>
    </footer>
  );
}

export default Footer;