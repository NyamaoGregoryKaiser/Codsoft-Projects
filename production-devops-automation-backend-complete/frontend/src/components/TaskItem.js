```javascript
import React from 'react';

function TaskItem({ task, onUpdate, onDelete }) {
  const handleStatusChange = (e) => {
    onUpdate(task.id, { status: e.target.value });
  };

  return (
    <div className="task-item">
      <h4>{task.title}</h4>
      <p>{task.description}</p>
      <p>Priority: {task.priority}</p>
      <p>Due Date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
      <p>Assignee: {task.assignee ? task.assignee.username : 'Unassigned'}</p>
      <div className="task-actions">
        <span>Status: </span>
        <select value={task.status} onChange={handleStatusChange}>
          <option value="pending">Pending</option>
          <option value="in-progress">In-Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
        <button onClick={() => onDelete(task.id)} className="delete-button">Delete</button>
      </div>
    </div>
  );
}

export default TaskItem;
```