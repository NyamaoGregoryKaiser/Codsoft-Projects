import React from 'react';
import { Box, Link, Stack, Text, Drawer, DrawerContent, DrawerOverlay, useBreakpointValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaHome, FaFileAlt, FaRss, FaTags, FaThLarge, FaImage, FaUsers, FaCog } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ icon, children, to }) => (
  <Link
    as={RouterLink}
    to={to}
    style={{ textDecoration: 'none' }}
    _focus={{ boxShadow: 'none' }}
  >
    <Flex
      align="center"
      p="4"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={{
        bg: 'cyan.400',
        color: 'white',
      }}
      color="whiteAlpha.800"
    >
      {icon && React.cloneElement(icon, { style: { marginRight: '1rem' } })}
      {children}
    </Flex>
  </Link>
);

const AdminSidebarContent = ({ onClose, ...rest }) => {
  const { isAdmin, isStaff } = useAuth();
  return (
    <Box
      bg="gray.800"
      borderRight="1px"
      borderRightColor="gray.700"
      w={{ base: 'full', md: '250px' }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" color="white">
          Admin Panel
        </Text>
        {/* Close button for mobile, if needed */}
      </Flex>
      <Stack as="nav" spacing={1}>
        <NavItem icon={<FaHome />} to="/admin/dashboard">Dashboard</NavItem>
        <NavItem icon={<FaRss />} to="/admin/posts">Posts</NavItem>
        <NavItem icon={<FaFileAlt />} to="/admin/pages">Pages</NavItem>
        <NavItem icon={<FaThLarge />} to="/admin/categories">Categories</NavItem>
        <NavItem icon={<FaTags />} to="/admin/tags">Tags</NavItem>
        <NavItem icon={<FaImage />} to="/admin/media">Media</NavItem>
        {isAdmin && (
          <NavItem icon={<FaUsers />} to="/admin/users">Users</NavItem>
        )}
        {/* <NavItem icon={<FaCog />} to="/admin/settings">Settings</NavItem> */}
      </Stack>
    </Box>
  );
};

const AdminSidebar = ({ isOpen, onClose }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
      >
        <DrawerOverlay />
        <DrawerContent bg="gray.800">
          <AdminSidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AdminSidebarContent display={{ base: 'none', md: 'block' }} />
  );
};

export default AdminSidebar;
```

#### `frontend/src/components/ContentEditor/RichTextEditor.js` (Simplified for this example)

```javascript