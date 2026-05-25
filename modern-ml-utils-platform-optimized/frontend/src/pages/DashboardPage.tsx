import { Box, Heading, Text, Flex, Button, SimpleGrid } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { FcDataSheet, FcProcess, FcManager } from 'react-icons/fc';

interface FeatureCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  link: string;
}

const FeatureCard = ({ icon, title, description, link }: FeatureCardProps) => (
  <Box
    p={6}
    bg="white"
    borderRadius="lg"
    boxShadow="md"
    _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
    transition="all 0.2s ease-in-out"
  >
    <Flex align="center" mb={4}>
      <Box fontSize="4xl" mr={4}>{icon}</Box>
      <Heading size="md">{title}</Heading>
    </Flex>
    <Text fontSize="sm" color="gray.600" mb={4}>
      {description}
    </Text>
    <Button as={RouterLink} to={link} colorScheme="blue" size="sm">
      Learn More
    </Button>
  </Box>
);

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <Heading as="h1" size="xl" mb={4}>
        Welcome to ML Utilities Hub{user && `, ${user.firstName || user.email}`}!
      </Heading>
      <Text fontSize="lg" color="gray.600" mb={8}>
        Your one-stop solution for managing datasets and applying essential machine learning data transformations.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={10}>
        <FeatureCard
          icon={<FcDataSheet />}
          title="Manage Datasets"
          description="Upload, view, and organize your machine learning datasets with ease."
          link="/datasets"
        />
        <FeatureCard
          icon={<FcProcess />}
          title="Data Utilities"
          description="Apply common preprocessing and feature engineering techniques like encoding and scaling."
          link="/utilities"
        />
        <FeatureCard
          icon={<FcManager />}
          title="Account Settings"
          description="Manage your profile information and account preferences."
          link="/profile" // Placeholder for a profile page
        />
      </SimpleGrid>

      <Flex justifyContent="center" mt={8}>
        <Button as={RouterLink} to="/datasets" colorScheme="teal" size="lg" mr={4}>
          Go to Datasets
        </Button>
        <Button as={RouterLink} to="/utilities" colorScheme="purple" size="lg" variant="outline">
          Explore Utilities
        </Button>
      </Flex>
    </Box>
  );
};

export default DashboardPage;