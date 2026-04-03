```javascript
import React from 'react';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const TaskList = ({ tasks, onEdit, onDelete, onToggleComplete }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-center text-gray-600 py-8 text-lg">
        No tasks found. Click "New Task" to add your first task!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            task.completed ? 'border-green-500' : 'border-blue-500'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <Link to={`/tasks/${task.id}`} className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
              {task.title}
            </Link>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {task.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
          <p className="text-gray-600 mb-4 text-sm line-clamp-2">{task.description || 'No description provided.'}</p>
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => onToggleComplete(task)}
                className={`p-2 rounded-full hover:bg-gray-200 transition duration-150 ${
                    task.completed ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'
                }`}
                title={task.completed ? 'Mark as Pending' : 'Mark as Complete'}
              >
                {task.completed ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => onEdit(task)}
                className="p-2 rounded-full text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition duration-150"
                title="Edit Task"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition duration-150"
                title="Delete Task"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
```