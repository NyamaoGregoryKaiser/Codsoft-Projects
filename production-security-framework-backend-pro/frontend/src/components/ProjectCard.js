```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project, onDelete, onUpdate }) => {
  const navigate = useNavigate();

  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <small>Owner ID: {project.owner_id}</small>
      <div className="project-actions">
        <button className="view-btn" onClick={() => navigate(`/projects/${project.id}`)}>View Details</button>
        <button className="edit-btn" onClick={() => onUpdate(project.id)}>Edit</button>
        <button className="delete-btn" onClick={() => onDelete(project.id)}>Delete</button>
      </div>
    </div>
  );
};

export default ProjectCard;
```