import React from 'react';
import { Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';
import { FaEdit, FaPlus, FaImage, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={6}>
        Welcome, {user?.first_name || user?.email}!
      </Heading>

      <Text fontSize="lg" mb={8}>
        Here's a quick overview of your content management system.
      </Text>

      <Heading as="h2" size="lg" mb={4}>
        At a Glance
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <StatLabel display="flex" alignItems="center">
            <FaRss style={{ marginRight: '8px' }} /> Total Posts
          </StatLabel>
          <StatNumber>1,234</StatNumber> {/* Replace with actual data fetching */}
          <StatHelpText>
            <StatArrow type="increase" />
            20% in last month
          </StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <StatLabel display="flex" alignItems="center">
            <FaFileAlt style={{ marginRight: '8px' }} /> Total Pages
          </StatLabel>
          <StatNumber>45</StatNumber> {/* Replace with actual data fetching */}
          <StatHelpText>
            <StatArrow type="increase" />
            5% in last month
          </StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <StatLabel display="flex" alignItems="center">
            <FaImage style={{ marginRight: '8px' }} /> Media Items
          </StatLabel>
          <StatNumber>876</StatNumber> {/* Replace with actual data fetching */}
          <StatHelpText>
            <StatArrow type="increase" />
            10% in last month
          </StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <StatLabel display="flex" alignItems="center">
            <FaUsers style={{ marginRight: '8px' }} /> Active Users
          </StatLabel>
          <StatNumber>120</StatNumber> {/* Replace with actual data fetching */}
          <StatHelpText>
            <StatArrow type="decrease" />
            3% in last week
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <Heading as="h2" size="lg" mb={4}>
        Quick Actions
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <Flex alignItems="center" mb={3}>
            <FaPlus size="20px" style={{ marginRight: '8px' }} />
            <Text fontSize="xl" fontWeight="semibold">Create New Post</Text>
          </Flex>
          <Text mb={4}>Start drafting a new blog post for your audience.</Text>
          <Button colorScheme="purple" onClick={() => console.log('Navigate to create post')}>Go to Editor</Button>
        </Box>

        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <Flex alignItems="center" mb={3}>
            <FaClipboardList size="20px" style={{ marginRight: '8px' }} />
            <Text fontSize="xl" fontWeight="semibold">Manage Pages</Text>
          </Flex>
          <Text mb={4}>Edit existing static pages like 'About Us' or 'Contact'.</Text>
          <Button colorScheme="blue" onClick={() => console.log('Navigate to manage pages')}>View Pages</Button>
        </Box>

        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white" _dark={{ bg: 'gray.700' }}>
          <Flex alignItems="center" mb={3}>
            <FaImage size="20px" style={{ marginRight: '8px' }} />
            <Text fontSize="xl" fontWeight="semibold">Upload Media</Text>
          </Flex>
          <Text mb={4}>Add new images or files to your media library.</Text>
          <Button colorScheme="green" onClick={() => console.log('Navigate to media library')}>Upload Files</Button>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
```

#### `frontend/src/pages/Admin/PostManagementPage.js` (Example for content management)

```javascript