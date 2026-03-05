import React from 'react';
import { Box, VStack, Link, Text, Icon, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  DashboardIcon,
  BarChartIcon,
  DatabaseIcon,
  UsersIcon,
} from '@chakra-ui/icons'; // Example icons, replace with actual if needed
import { MdDashboard, MdOutlineBarChart, MdDns, MdPeople } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const bgColor = useColorModeValue('white', 'gray.700');
  const linkColor = useColorModeValue('gray.600', 'gray.300');
  const activeLinkBg = useColorModeValue('brand.100', 'brand.700');
  const activeLinkColor = useColorModeValue('brand.700', 'white');

  const navItems = [
    { label: 'Dashboards', icon: MdDashboard, to: '/dashboards', roles: ['user', 'admin'] },
    { label: 'Charts', icon: MdOutlineBarChart, to: '/charts', roles: ['user', 'admin'] },
    { label: 'Data Sources', icon: MdDns, to: '/data-sources', roles: ['user', 'admin'] },
    { label: 'User Management', icon: MdPeople, to: '/admin/users', roles: ['admin'] },
  ];

  return (
    <Box
      as="nav"
      position="fixed"
      top="70px" // Height of the header
      left="0"
      h="calc(100vh - 70px)" // Remaining height
      w="200px"
      bg={bgColor}
      boxShadow="md"
      p={4}
      borderRight="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      zIndex="sticky"
      display={{ base: 'none', md: 'block' }} // Hide on mobile, show on desktop
    >
      <VStack align="stretch" spacing={2}>
        {navItems.map((item) => (
          (item.roles.includes(user?.role) || item.roles.length === 0) && ( // Check if user has required role
            <Link
              as={RouterLink}
              to={item.to}
              key={item.label}
              p={3}
              borderRadius="md"
              _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
              bg={location.pathname.startsWith(item.to) ? activeLinkBg : 'transparent'}
              color={location.pathname.startsWith(item.to) ? activeLinkColor : linkColor}
              fontWeight={location.pathname.startsWith(item.to) ? 'bold' : 'normal'}
              display="flex"
              alignItems="center"
            >
              <Icon as={item.icon} mr={3} fontSize="xl" />
              <Text fontSize="md">{item.label}</Text>
            </Link>
          )
        ))}
      </VStack>
    </Box>
  );
}

export default Sidebar;