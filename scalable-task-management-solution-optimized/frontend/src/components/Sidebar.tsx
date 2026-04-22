import { Box, VStack, Text, useColorMode, Icon, Divider, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  MdDashboard,
  MdFolderOpen,
  MdAssignmentTurnedIn,
  MdPeople,
  MdSettings,
  MdOutlineLogout,
} from 'react-icons/md';
import { FaTags } from 'react-icons/fa';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/lib/types'; // Assuming types file exists
import { useEffect, useState } from 'react';

const NavItem = ({ icon, children, href }: { icon: any; children: string; href: string }) => {
  const router = useRouter();
  const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));
  const { colorMode } = useColorMode();

  return (
    <Link href={href} passHref>
      <Button
        as="a"
        leftIcon={<Icon as={icon} />}
        variant="ghost"
        justifyContent="flex-start"
        width="full"
        py={6}
        fontSize="lg"
        color={isActive ? 'brand.500' : (colorMode === 'light' ? 'gray.700' : 'gray.200')}
        bg={isActive ? (colorMode === 'light' ? 'brand.50' : 'brand.900') : 'transparent'}
        _hover={{
          bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
          color: 'brand.500',
        }}
        _active={{
          bg: colorMode === 'light' ? 'brand.100' : 'brand.800',
        }}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </Button>
    </Link>
  );
};

const Sidebar = () => {
  const { colorMode } = useColorMode();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.roles?.includes(Role.Admin) || false);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Box
      as="nav"
      position="fixed"
      left="0"
      top="0"
      h="100vh"
      w="250px"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      color={colorMode === 'light' ? 'gray.800' : 'whiteAlpha.900'}
      borderRight="1px"
      borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
      pt="4"
      pb="4"
      boxShadow="md"
      zIndex="overlay"
      display={{ base: 'none', md: 'block' }} // Hide on small screens
    >
      <VStack spacing={0} align="stretch" px={4}>
        <Text fontSize="2xl" fontWeight="extrabold" mb={6} ml={2} color="brand.500">
          TaskFlow
        </Text>
        <Divider mb={4} />

        <NavItem icon={MdDashboard} href="/dashboard">
          Dashboard
        </NavItem>
        <NavItem icon={MdFolderOpen} href="/projects">
          Projects
        </NavItem>
        <NavItem icon={MdAssignmentTurnedIn} href="/tasks">
          Tasks
        </NavItem>
        {isAdmin && (
          <>
            <NavItem icon={MdPeople} href="/users">
              Users
            </NavItem>
            <NavItem icon={FaTags} href="/tags">
              Tags
            </NavItem>
          </>
        )}
      </VStack>

      <VStack spacing={0} align="stretch" px={4} position="absolute" bottom="4" width="full">
        <Divider my={4} />
        <NavItem icon={MdSettings} href="/profile">
          Settings
        </NavItem>
        <Button
          leftIcon={<Icon as={MdOutlineLogout} />}
          variant="ghost"
          justifyContent="flex-start"
          width="full"
          py={6}
          fontSize="lg"
          color="red.400"
          _hover={{ bg: colorMode === 'light' ? 'red.50' : 'red.900' }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </VStack>
    </Box>
  );
};

export default Sidebar;