import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import { Project } from '../../types';
import moment from 'moment';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, isDeleting, deletingId }) => {
  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      onDelete(project.id);
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold text-primary dark:text-secondary mb-2">{project.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Created: {moment(project.createdAt).format('MMM Do, YYYY')}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
          API Key: <span className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-xs">{project.apikey}</span>
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/projects/${project.id}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDeleteClick}
          isLoading={isDeleting && deletingId === project.id}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default ProjectCard;
```

```