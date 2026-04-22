import { Box, Flex, Text, Button, IconButton, useColorMode, Menu, MenuButton, MenuList, MenuItem, Avatar, Icon } from '@chakra-ui/react';
import { MoonIcon, SunIcon, BellIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaTasks } from 'react-icons/fa';

const Header = () => {
  const { toggleColorMode, colorMode } = useColorMode();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Flex
      as="header"
      width="full"
      align="center"
      justify="space-between"
      p={4}
      bg={colorMode === 'light' ? 'white' : 'gray.700'}
      borderBottom="1px"
      borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
      boxShadow="sm"
      zIndex="sticky"
      position="fixed"
      top="0"
      left="0"
      right="0"
      ml={{ base: 0, md: '250px' }} // Account for sidebar width
    >
      <Flex align="center">
        <Icon as={FaTasks} w={6} h={6} color="brand.500" mr={2} />
        <Text fontSize="xl" fontWeight="bold" color="brand.500">
          TaskFlow
        </Text>
      </Flex>

      <Flex align="center">
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          mr={3}
          variant="ghost"
        />
        <IconButton aria-label="Notifications" icon={<BellIcon />} mr={3} variant="ghost" />

        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost">
            <Avatar size="sm" name={user?.username || 'User'} />
            <Text ml={2} display={{ base: 'none', md: 'inline' }}>
              {user?.username}
            </Text>
          </MenuButton>
          <MenuList>
            <Link href="/profile" passHref>
              <MenuItem as="a">Profile</MenuItem>
            </Link>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

export default Header;