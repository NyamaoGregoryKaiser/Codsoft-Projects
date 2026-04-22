import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  useToast,
  Flex,
  Spinner,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import api from '@/api';
import { Project, CreateProjectData } from '@/lib/types';
import ProjectCard from '@/components/ProjectCard';
import { AddIcon } from '@chakra-ui/icons';
import ProjectForm from '@/components/forms/ProjectForm';

const ProjectsPage = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error: any) {
      toast({
        title: 'Error fetching projects.',
        description: error.response?.data?.message || 'Could not load projects.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data: CreateProjectData) => {
    setIsSubmitting(true);
    try {
      await api.post('/projects', data);
      toast({
        title: 'Project created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose(); // Close the modal
      fetchProjects(); // Refresh the list
    } catch (error: any) {
      toast({
        title: 'Failed to create project.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={5} pt={20}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          My Projects
        </Heading>
        <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={onOpen}>
          New Project
        </Button>
      </Flex>

      {projects.length === 0 ? (
        <Text fontSize="lg" textAlign="center" mt={10}>
          You haven't created any projects yet. Click "New Project" to get started!
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ProjectForm onSubmit={handleCreateProject} isLoading={isSubmitting} />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={isSubmitting}
              form="project-form" // Link to the form's ID
              type="submit"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectsPage;