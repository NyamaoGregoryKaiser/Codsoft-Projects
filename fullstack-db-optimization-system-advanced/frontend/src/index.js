import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // Import Tailwind CSS and global styles
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
```

#### `frontend/.env.example`
```ini