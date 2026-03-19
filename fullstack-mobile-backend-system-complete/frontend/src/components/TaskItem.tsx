import React from 'react';
import { Task, TaskStatus, UpdateTaskInput } from '../types';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, data: UpdateTaskInput) => Promise<void>;
  isUserAdmin: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onDelete, onUpdateStatus, isUserAdmin }) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(task.id, { status: e.target.value as TaskStatus });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div className="flex-1 mb-2 sm:mb-0">
        <h4 className="text-lg font-semibold text-gray-800">{task.title}</h4>
        {task.description && <p className="text-gray-600 text-sm mt-1">{task.description}</p>}
        <p className="text-gray-500 text-xs mt-1">
          Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A'}
        </p>
        {(isUserAdmin && task.user) && (
          <p className="text-gray-500 text-xs">Assigned to: {task.user.name} ({task.user.email})</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace(/_/g, ' ')}
        </span>
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.values(TaskStatus).map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          onClick={() => onEdit(task)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;