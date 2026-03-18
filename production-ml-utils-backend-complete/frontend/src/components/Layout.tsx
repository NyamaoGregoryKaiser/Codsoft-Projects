import React, { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box>
      <Navbar />
      <Box p={4}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
```