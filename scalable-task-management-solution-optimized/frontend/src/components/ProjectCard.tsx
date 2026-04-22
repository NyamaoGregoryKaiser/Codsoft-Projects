import { Box, Heading, Text, Badge, Flex, useColorModeValue } from '@chakra-ui/react';
import Link from 'next/link';
import { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const descriptionColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Link href={`/projects/${project.id}`} passHref>
      <Box
        as="a"
        p={5}
        shadow="md"
        borderWidth="1px"
        borderRadius="lg"
        bg={cardBg}
        _hover={{ shadow: 'xl', transform: 'translateY(-2px)', cursor: 'pointer' }}
        transition="all 0.2s ease-in-out"
        height="100%"
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Heading fontSize="xl" color={textColor} isTruncated>
            {project.name}
          </Heading>
          <Badge colorScheme={project.isCompleted ? 'green' : 'orange'}>
            {project.isCompleted ? 'Completed' : 'Active'}
          </Badge>
        </Flex>
        <Text fontSize="sm" color={descriptionColor} noOfLines={2}>
          {project.description || 'No description provided.'}
        </Text>
        <Text mt={3} fontSize="xs" color="gray.500">
          Created: {new Date(project.createdAt).toLocaleDateString()}
        </Text>
      </Box>
    </Link>
  );
};

export default ProjectCard;