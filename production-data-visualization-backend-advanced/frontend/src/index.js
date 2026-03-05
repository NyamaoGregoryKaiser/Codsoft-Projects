import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import customTheme from './themes/customTheme';
import { AuthProvider } from './contexts/AuthContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={customTheme}>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ChakraProvider>
  </React.StrictMode>
);

reportWebVitals();