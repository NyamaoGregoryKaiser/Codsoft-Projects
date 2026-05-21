import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, CalendarDaysIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

const ProjectCard = ({ project, onEdit, onDelete, currentUser }) => {
  if (!project) return null;

  const isOwner = currentUser?.id === project.owner_id || currentUser?.is_superuser;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-grow">
        <div className="flex items-center mb-3">
          <FolderIcon className="h-6 w-6 text-primary mr-2" />
          <h3 className="text-xl font-semibold text-gray-800">{project.name}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description || 'No description provided.'}
        </p>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="mr-1">Owner:</span>
          <span className="font-medium text-gray-700">{project.owner?.username || 'N/A'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <ListBulletIcon className="h-4 w-4 mr-1" />
          <span>{project.tasks_count !== undefined ? `${project.tasks_count} Tasks` : 'Loading tasks...'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarDaysIcon className="h-4 w-4 mr-1" />
          <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-t">
        <Link to={`/projects/${project.id}`} className="text-primary hover:text-primary-dark font-medium text-sm">
          View Details
        </Link>
        {isOwner && (
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(project)} className="text-sm">
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(project.id)} className="text-sm">
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;