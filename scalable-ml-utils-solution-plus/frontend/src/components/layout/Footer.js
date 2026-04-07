```javascript
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} ML Utilities Hub. All rights reserved.</p>
      <p>Built with React & Node.js</p>
    </footer>
  );
};

export default Footer;
```