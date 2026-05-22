```typescript
import React from 'react';
import { Task, TaskPriority, TaskStatus } from 'types';
import { Link } from 'react-router-dom';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const getStatusClass = (status: TaskStatus) => {
  switch (status) {
    case 'todo': return 'status-todo';
    case 'in-progress': return 'status-in-progress';
    case 'done': return 'status-done';
    case 'archived': return 'status-archived';
    default: return '';
  }
};

const getPriorityClass = (priority: TaskPriority) => {
  switch (priority) {
    case 'low': return 'priority-low';
    case 'medium': return 'priority-medium';
    case 'high': return 'priority-high';
    default: return '';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date';

  return (
    <div className="task-card">
      <Link to={`/tasks/${task.id}`} className="task-card-title">
        <h3>{task.title}</h3>
      </Link>
      <p className="task-card-description">{task.description || 'No description provided.'}</p>
      <div className="task-card-meta">
        <span className={`task-status ${getStatusClass(task.status)}`}>{task.status.replace('-', ' ')}</span>
        <span className={`task-priority ${getPriorityClass(task.priority)}`}>{task.priority}</span>
        <span>Due: {dueDate}</span>
        {task.assignee && <span>Assignee: {task.assignee.firstName} {task.assignee.lastName}</span>}
      </div>
      <div className="task-card-actions">
        <button onClick={() => onEdit(task)}>Edit</button>
        <button onClick={() => onDelete(task.id)} className="delete-btn">Delete</button>
      </div>
    </div>
  );
};

export default TaskCard;
```