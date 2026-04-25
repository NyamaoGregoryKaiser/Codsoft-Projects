```typescript
import React, { useState, useEffect } from 'react';
import { CreateTaskData, UpdateTaskData, Task, User, TaskStatus } from '@/utils/types';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

interface TaskFormProps {
  initialData?: Task;
  availableUsers?: Omit<User, 'projects' | 'tasks'>[];
  onSubmit: (data: CreateTaskData | UpdateTaskData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, availableUsers, onSubmit, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialData?.status || 'pending');
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? dayjs(initialData.dueDate).format('YYYY-MM-DDTHH:mm') : ''
  );
  const [assignedToId, setAssignedToId] = useState<string | null>(initialData?.assignedTo?.id || null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
      setDueDate(initialData.dueDate ? dayjs(initialData.dueDate).format('YYYY-MM-DDTHH:mm') : '');
      setAssignedToId(initialData.assignedTo?.id || null);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title cannot be empty.');
      return;
    }

    const data: CreateTaskData | UpdateTaskData = {
      title,
      description: description.trim() === '' ? null : description,
      status,
      dueDate: dueDate ? dayjs(dueDate).toISOString() : null,
      assignedToId: assignedToId || null,
    };

    await onSubmit(data);
  };

  const statusOptions: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Task Title
        </label>
        <input
          type="text"
          id="title"
          className="mt-1 input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          className="mt-1 input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        ></textarea>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          className="mt-1 input-field"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          disabled={isSubmitting}
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, ' ').charAt(0).toUpperCase() + opt.replace(/_/g, ' ').slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
          Due Date (Optional)
        </label>
        <input
          type="datetime-local"
          id="dueDate"
          className="mt-1 input-field"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
          Assigned To (Optional)
        </label>
        <select
          id="assignedTo"
          className="mt-1 input-field"
          value={assignedToId || ''}
          onChange={(e) => setAssignedToId(e.target.value || null)}
          disabled={isSubmitting}
        >
          <option value="">Unassigned</option>
          {availableUsers?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
```