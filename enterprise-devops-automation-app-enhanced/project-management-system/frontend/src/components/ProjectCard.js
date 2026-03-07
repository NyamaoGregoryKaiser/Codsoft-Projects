```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectCard.css';
import moment from 'moment';

function ProjectCard({ project }) {
  const statusClass = `project-status-${project.status.toLowerCase()}`;
  const membersCount = project.members ? project.members.length : 0;

  return (
    <div className="project-card">
      <h3>
        <Link to={`/projects/${project.id}`}>{project.name}</Link>
      </h3>
      <p className="project-description">{project.description}</p>
      <div className="project-meta">
        <span className={statusClass}>{project.status}</span>
        <span>Owner: {project.owner?.name || 'N/A'}</span>
        <span>Members: {membersCount}</span>
        {project.dueDate && <span>Due: {moment(project.dueDate).format('YYYY-MM-DD')}</span>}
      </div>
    </div>
  );
}

export default ProjectCard;
```