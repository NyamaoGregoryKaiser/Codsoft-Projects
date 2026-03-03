import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, CreateTaskDto, UpdateTaskDto } from '../types/task';
import { User } from '../types/auth'; // Assuming User type is available
import { useAuth } from '../hooks/useAuth';

interface TaskFormProps {
  task?: Task; // Optional, for editing existing tasks
  onSubmit: (task: CreateTaskDto | UpdateTaskDto) => void;
  onCancel?: () => void;
  isLoading: boolean;
  users?: User[]; // Optional list of users for assignee selection (admin only)
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel, isLoading, users = [] }) => {
  const { user: currentUser } = useAuth();
  const isEditMode = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || TaskStatus.PENDING);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(task?.assignee?.id || currentUser?.id);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
      setAssigneeId(task.assignee?.id || currentUser?.id);
    } else {
        // Reset form for new task if current user is not admin, default assignee to self
        if (currentUser && currentUser.role !== 'ADMIN') {
            setAssigneeId(currentUser.id);
        } else {
            setAssigneeId(undefined); // Allow admin to choose, or leave unassigned
        }
    }
  }, [task, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: CreateTaskDto | UpdateTaskDto = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeId: assigneeId === '' ? undefined : assigneeId, // Send undefined if empty
    };
    onSubmit(taskData);
  };

  const isAssigneeSelectDisabled = currentUser?.role !== 'ADMIN' && (isEditMode ? task?.assignee?.id !== currentUser?.id : false);

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <h3>{isEditMode ? 'Edit Task' : 'Create New Task'}</h3>
      <div className="form-group">
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        ></textarea>
      </div>
      <div className="form-group">
        <label htmlFor="status">Status:</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          disabled={isLoading}
        >
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="priority">Priority:</label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={isLoading}
        >
          {Object.values(TaskPriority).map((p) => (
            <option key={p} value={p}>
              {p.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="dueDate">Due Date:</label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isLoading}
        />
      </div>
      {(currentUser?.role === 'ADMIN' || !isEditMode) && ( // Admin can assign, or when creating
        <div className="form-group">
          <label htmlFor="assignee">Assignee:</label>
          <select
            id="assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value === 'unassigned' ? '' : e.target.value)}
            disabled={isLoading || isAssigneeSelectDisabled}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;