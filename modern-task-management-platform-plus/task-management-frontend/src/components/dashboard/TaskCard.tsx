```tsx
import React from 'react';
import { Card, CardContent, Typography, Chip, Stack, Box } from '@mui/material';
import { Task } from '../../types/task';
import { formatDateTime } from '../../utils/dateTimeFormatter'; // Custom utility

interface TaskCardProps {
  task: Task;
  children?: React.ReactNode;
}

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS': return 'info';
    case 'PENDING': return 'warning';
    case 'CANCELED': return 'error';
    default: return 'default';
  }
};

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'URGENT': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'default';
    default: return 'default';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, children }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {task.description || 'No description provided.'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
          <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
        </Stack>
        {task.dueDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Due: {formatDateTime(task.dueDate)}
          </Typography>
        )}
        {task.project && (
          <Typography variant="body2" color="text.secondary">
            Project: {task.project.name}
          </Typography>
        )}
        {task.assignee && (
          <Typography variant="body2" color="text.secondary">
            Assignee: {task.assignee.username}
          </Typography>
        )}
        {task.tags && task.tags.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {task.tags.map(tag => (
              <Chip key={tag.id} label={tag.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
        )}
      </CardContent>
      {children && <Box sx={{ p: 2, pt: 0 }}>{children}</Box>}
    </Card>
  );
};

export default TaskCard;
```