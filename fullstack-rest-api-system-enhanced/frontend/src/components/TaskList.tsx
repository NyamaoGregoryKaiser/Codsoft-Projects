import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/task';
import { UserRole } from '../types/auth'; // Assuming UserRole is available from auth types
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  currentUserRole: UserRole;
  currentUserId: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete, currentUserRole, currentUserId }) => {
  if (tasks.length === 0) {
    return <p>No tasks found.</p>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className="task-item card">
          <div className="task-header">
            <h4>{task.title}</h4>
            <span className={`task-priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
          </div>
          <p className="task-description">{task.description}</p>
          <div className="task-meta">
            <span>Status: <span className={`task-status status-${task.status.toLowerCase()}`}>{task.status.replace(/_/g, ' ')}</span></span>
            {task.dueDate && <span>Due: {format(new Date(task.dueDate), 'PPP')}</span>}
            {task.assignee && <span>Assignee: {task.assignee.firstName} {task.assignee.lastName}</span>}
          </div>
          <div className="task-actions">
            {(currentUserRole === UserRole.ADMIN || task.assigneeId === currentUserId) && (
              <>
                <button onClick={() => onEdit(task)} className="btn btn-primary btn-sm">Edit</button>
                <button onClick={() => onDelete(task.id)} className="btn btn-danger btn-sm">Delete</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;