import { Box, Heading, Text, SimpleGrid, useToast, Flex, Spinner } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import api from '@/api';
import { Project, Task, TaskStatus } from '@/lib/types';
import ProjectCard from '@/components/ProjectCard';
import TaskCard from '@/components/TaskCard';

const DashboardPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks?status=' + TaskStatus.TODO), // Get only 'TODO' tasks for dashboard
        ]);
        setProjects(projectsRes.data.slice(0, 3)); // Show top 3 projects
        setTasks(tasksRes.data.slice(0, 5)); // Show top 5 TODO tasks
      } catch (error: any) {
        toast({
          title: 'Error fetching dashboard data.',
          description: error.response?.data?.message || 'Could not load data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={5} pt={20}> {/* Adjust pt to account for fixed header */}
      <Heading as="h1" size="xl" mb={6}>
        Dashboard
      </Heading>

      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4}>
          My Projects (Latest)
        </Heading>
        {projects.length === 0 ? (
          <Text>No projects found. Start by creating a new one!</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Box>
        <Heading as="h2" size="lg" mb={4}>
          Upcoming Tasks
        </Heading>
        {tasks.length === 0 ? (
          <Text>No upcoming tasks. Enjoy your free time!</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;