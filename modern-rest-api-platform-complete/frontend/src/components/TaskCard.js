import React from 'react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

const statusColors = {
  todo: 'bg-gray-200 text-gray-800',
  in_progress: 'bg-blue-200 text-blue-800',
  done: 'bg-green-200 text-green-800',
};

const priorityColors = {
  low: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

function TaskCard({ projectId, task, onDelete, onEdit }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 relative">
      <Link to={`/projects/${projectId}/tasks/${task.id}`} className="block">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 truncate">
          {task.title}
        </h4>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description || 'No description provided.'}
        </p>
        <div className="flex items-center space-x-2 mb-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
              statusColors[task.status]
            }`}
          >
            {task.status.replace('_', ' ')}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Assigned to: {task.assigned_to?.email || 'Unassigned'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Last Updated: {formatDate(task.updated_at)}
        </div>
      </Link>
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => onEdit(task)}
          className="text-blue-500 hover:text-blue-700 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
          title="Edit Task"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
          title="Delete Task"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
```