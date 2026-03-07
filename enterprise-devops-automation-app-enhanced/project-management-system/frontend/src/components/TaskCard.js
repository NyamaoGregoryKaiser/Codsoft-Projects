```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import './TaskCard.css';
import moment from 'moment';

function TaskCard({ task, projectId }) {
  const statusClass = `task-status-${task.status.toLowerCase().replace('-', '')}`;
  const priorityClass = `task-priority-${task.priority.toLowerCase()}`;

  return (
    <div className="task-card">
      <h4>
        <Link to={`/projects/${projectId}/tasks/${task.id}`}>{task.title}</Link>
      </h4>
      <p className="task-description">{task.description}</p>
      <div className="task-meta">
        <span className={statusClass}>{task.status}</span>
        <span className={priorityClass}>{task.priority}</span>
        {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
        {task.dueDate && <span>Due: {moment(task.dueDate).format('YYYY-MM-DD')}</span>}
      </div>
    </div>
  );
}

export default TaskCard;
```