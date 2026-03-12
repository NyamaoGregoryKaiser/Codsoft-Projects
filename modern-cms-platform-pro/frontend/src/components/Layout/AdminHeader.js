import React from 'react';
import { Flex, IconButton, Text, Box, Menu, MenuButton, Avatar, MenuList, MenuItem } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SITE_NAME } from '../../config';

const AdminHeader = ({ onOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      bg="gray.800"
      color="white"
      p={4}
      borderBottom="1px"
      borderColor="gray.700"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Flex align="center">
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open Menu"
          onClick={onOpen}
          display={{ base: 'flex', md: 'none' }}
          mr={2}
          variant="ghost"
          colorScheme="whiteAlpha"
        />
        <Text fontSize="xl" fontWeight="bold" mr={4} onClick={() => navigate('/admin/dashboard')} cursor="pointer">
          {SITE_NAME} Admin
        </Text>
      </Flex>

      <Box>
        <Menu>
          <MenuButton as={Avatar} size="sm" name={user?.first_name || user?.email} src="https://bit.ly/broken-link" cursor="pointer" />
          <MenuList bg="gray.700" borderColor="gray.600">
            <MenuItem onClick={() => navigate('/admin/profile')} _hover={{ bg: 'gray.600' }}>Profile</MenuItem>
            <MenuItem onClick={handleLogout} _hover={{ bg: 'gray.600' }}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Flex>
  );
};

export default AdminHeader;
```

#### `frontend/src/components/Layout/AdminSidebar.js`

```javascript