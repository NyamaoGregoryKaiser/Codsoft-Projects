```javascript
import React from 'react';
import { Link } from 'react-router-dom';

function ProjectCard({ project, onDelete, onEdit }) {
  return (
    <div className="project-card">
      <h3><Link to={`/projects/${project.id}`}>{project.name}</Link></h3>
      <p>{project.description}</p>
      <p>Status: {project.status}</p>
      <p>Owner: {project.owner.username}</p>
      <div className="project-actions">
        <button onClick={() => onEdit(project.id)}>Edit</button>
        <button onClick={() => onDelete(project.id)} className="delete-button">Delete</button>
      </div>
    </div>
  );
}

export default ProjectCard;
```