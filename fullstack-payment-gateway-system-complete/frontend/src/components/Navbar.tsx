import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', roles: [UserRole.MERCHANT_USER, UserRole.ADMIN] },
    { label: 'Transactions', href: '/transactions', roles: [UserRole.MERCHANT_USER, UserRole.ADMIN] },
    { label: 'Users', href: '/users', roles: [UserRole.MERCHANT_USER, UserRole.ADMIN] },
    { label: 'Webhooks', href: '/webhooks', roles: [UserRole.MERCHANT_USER] },
    { label: 'Merchants', href: '/merchants', roles: [UserRole.ADMIN] }, // Admin only
  ];

  return (
    <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4} borderBottom="1px" borderColor="gray.200">
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <Text fontSize="xl" fontWeight="bold">
          <RouterLink to="/dashboard">Payment System</RouterLink>
        </Text>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7} mr={4}>
            {navItems.map(
              (item) =>
                hasRole(item.roles) && (
                  <Button as={RouterLink} to={item.href} variant="ghost" key={item.label}>
                    {item.label}
                  </Button>
                ),
            )}
          </Stack>

          <Menu>
            <MenuButton as={Button} rounded={'full'} variant={'link'} cursor={'pointer'} minW={0}>
              <Text fontWeight="bold">{user?.email}</Text>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem> {/* Placeholder */}
              <MenuDivider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;