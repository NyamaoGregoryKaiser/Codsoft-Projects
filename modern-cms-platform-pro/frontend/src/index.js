import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Extend the Chakra UI theme (optional)
const theme = extendTheme({
  config: {
    initialColorMode: 'light', // or 'dark'
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
        _dark: {
          bg: 'gray.900',
          color: 'whiteAlpha.900',
        },
      },
    },
  },
  // Customize other components if needed
  components: {
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'none',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
```

#### `frontend/package.json`

```json