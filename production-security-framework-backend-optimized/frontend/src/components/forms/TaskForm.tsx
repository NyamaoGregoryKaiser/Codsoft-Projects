```typescript
import React, { useState, useEffect } from 'react';
import { CreateTaskData, UpdateTaskData, User, TaskStatus } from '../../types';

interface TaskFormProps {
  initialData?: UpdateTaskData;
  projectId: string;
  users: User[]; // List of possible assignees
  onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  projectId,
  users,
  onSubmit,
  onCancel,
  isEditMode = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialData?.status || TaskStatus.Open);
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || '');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    setTitle(initialData?.title || '');
    setDescription(initialData?.description || '');
    setStatus(initialData?.status || TaskStatus.Open);
    setDueDate(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
    setAssigneeId(initialData?.assigneeId || '');
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be at most 100 characters long.';
    }
    if (description && description.length > 500) {
      newErrors.description = 'Description must be at most 500 characters long.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const data: CreateTaskData | UpdateTaskData = {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId: assigneeId || undefined,
        projectId: projectId, // Always include projectId for task creation
      };
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isEditMode ? 'Edit Task' : 'Create New Task'}
      </h2>
      <div className="mb-4">
        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
          Title:
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            errors.title ? 'border-red-500' : ''
          }`}
        />
        {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
          Description (Optional):
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            errors.description ? 'border-red-500' : ''
          }`}
        ></textarea>
        {errors.description && <p className="text-red-500 text-xs italic mt-1">{errors.description}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
          Status:
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">
          Due Date (Optional):
        </label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="assignee" className="block text-gray-700 text-sm font-bold mb-2">
          Assignee (Optional):
        </label>
        <select
          id="assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isEditMode ? 'Update Task' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
```