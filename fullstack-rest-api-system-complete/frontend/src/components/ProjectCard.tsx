import React from 'react';
import { Project } from '../types';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void; // For future edit modal
  isOwner: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onEdit, isOwner }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          <Link to={`/projects/${project.id}`} className="hover:text-blue-600">
            {project.name}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4">{project.description || 'No description provided.'}</p>
        <div className="text-xs text-gray-500 mb-2">
          <p><strong>Owner:</strong> {project.owner.firstName} {project.owner.lastName}</p>
          <p><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Link to={`/projects/${project.id}`} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
          View Details
        </Link>
        {isOwner && (
          <>
            {/* <button
              onClick={() => onEdit(project)}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Edit
            </button> */}
            <button
              onClick={() => onDelete(project.id)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;