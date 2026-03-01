import React from 'react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

function ProjectCard({ project, onDelete, onEdit }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative">
      <Link to={`/projects/${project.id}`} className="block p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
          {project.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description || 'No description provided.'}
        </p>
        <div className="text-xs text-gray-500">
          Created: {formatDate(project.created_at)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Last Updated: {formatDate(project.updated_at)}
        </div>
      </Link>
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => onEdit(project)}
          className="text-blue-500 hover:text-blue-700 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
          title="Edit Project"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(project.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
          title="Delete Project"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
```