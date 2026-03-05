import { extendTheme } from '@chakra-ui/react';

const customTheme = extendTheme({
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  colors: {
    brand: {
      50: '#e6f0ff',
      100: '#c2daff',
      200: '#99c3ff',
      300: '#6aa8ff',
      400: '#3d8eff',
      500: '#006fff', // Primary brand color
      600: '#005edb',
      700: '#004daa',
      800: '#003c7a',
      900: '#002a4a',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
      },
      sizes: {
        xl: {
          h: '56px',
          fontSize: 'lg',
          px: '32px',
        },
      },
      variants: {
        brandPrimary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
      },
    },
    // You can add more component overrides here
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

export default customTheme;