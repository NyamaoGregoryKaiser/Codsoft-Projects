import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot from react-dom/client
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './styles/index.css'; // Import Tailwind CSS

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container); // Create a root

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);