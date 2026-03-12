import React from 'react';
import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex direction="column" minH="100vh">
      <AdminHeader onOpen={onOpen} />
      <Flex flex="1">
        <AdminSidebar isOpen={isOpen} onClose={onClose} />
        <Box flex="1" p={4} ml={{ base: 0, md: '250px' }} transition="margin-left 0.3s ease">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default AdminLayout;
```

#### `frontend/src/components/Layout/AdminHeader.js`

```javascript