import { Box, Heading, Text, Badge, Flex, useColorModeValue } from '@chakra-ui/react';
import Link from 'next/link';
import { Task, TaskStatus } from '@/lib/types';

interface TaskCardProps {
  task: Task;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
      return 'red';
    case TaskStatus.IN_PROGRESS:
      return 'blue';
    case TaskStatus.DONE:
      return 'green';
    case TaskStatus.ARCHIVED:
      return 'gray';
    default:
      return 'gray';
  }
};

const TaskCard = ({ task }: TaskCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const descriptionColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Link href={`/tasks/${task.id}`} passHref>
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
            {task.title}
          </Heading>
          <Badge colorScheme={getStatusColor(task.status)}>{task.status}</Badge>
        </Flex>
        <Text fontSize="sm" color={descriptionColor} noOfLines={2}>
          {task.description || 'No description provided.'}
        </Text>
        <Text mt={3} fontSize="xs" color="gray.500">
          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
        </Text>
        {task.assignee && (
          <Text mt={1} fontSize="xs" color="gray.500">
            Assigned to: {task.assignee.username}
          </Text>
        )}
        {task.tags && task.tags.length > 0 && (
          <Flex mt={2} wrap="wrap">
            {task.tags.map(tag => (
              <Badge key={tag.id} mr={1} mb={1} colorScheme="purple">
                {tag.name}
              </Badge>
            ))}
          </Flex>
        )}
      </Box>
    </Link>
  );
};

export default TaskCard;