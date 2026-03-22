```javascript
import React from 'react';

const TaskItem = ({ task, onUpdateStatus, onDelete }) => {
  return (
    <li className="task-item">
      <span>{task.title}</span>
      <span className="status">Status: {task.status}</span>
      {task.assigned_to_id && <small>Assigned to: {task.assigned_to_id}</small>}
      <div>
        <button 
          className="complete-btn" 
          onClick={() => onUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
        >
          {task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
        </button>
        {/* For a full app, you'd have an edit button that opens a form */}
        <button className="delete-btn" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </li>
  );
};

export default TaskItem;
```