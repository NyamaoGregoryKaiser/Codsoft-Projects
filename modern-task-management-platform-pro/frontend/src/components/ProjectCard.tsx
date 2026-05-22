```typescript
import React from 'react';
import { Project } from 'types';
import { Link } from 'react-router-dom';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  return (
    <div className="project-card">
      <Link to={`/projects/${project.id}`} className="project-card-title">
        <h3>{project.name}</h3>
      </Link>
      <p className="project-card-description">{project.description || 'No description provided.'}</p>
      <div className="project-card-meta">
        <span>Owner: {project.owner.firstName} {project.owner.lastName}</span>
        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="project-card-actions">
        <button onClick={() => onEdit(project)}>Edit</button>
        <button onClick={() => onDelete(project.id)} className="delete-btn">Delete</button>
      </div>
    </div>
  );
};

export default ProjectCard;
```