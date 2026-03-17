import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-auto">
      <div className="container">
        &copy; {new Date().getFullYear()} CMS System. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;