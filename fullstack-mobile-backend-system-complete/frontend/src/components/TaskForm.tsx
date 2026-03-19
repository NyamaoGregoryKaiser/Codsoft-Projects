import React, { useState, useEffect } from 'react';
import { CreateTaskInput, UpdateTaskInput, TaskStatus, Task } from '../types';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput | UpdateTaskInput, id?: string) => Promise<void>;
  initialData?: Task;
  isEditing?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialData, isEditing = false }) => {
  const [formData, setFormData] = useState<CreateTaskInput | UpdateTaskInput>(
    initialData
      ? {
          title: initialData.title,
          description: initialData.description || '',
          dueDate: initialData.dueDate || null,
          status: initialData.status,
        }
      : {
          title: '',
          description: '',
          dueDate: null,
          status: TaskStatus.PENDING,
        }
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : '',
        status: initialData.status,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: null,
        status: TaskStatus.PENDING,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'dueDate') {
      // Convert to ISO string for backend
      setFormData((prev) => ({ ...prev, [name]: value ? new Date(value).toISOString() : null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && initialData) {
        await onSubmit(formData, initialData.id);
      } else {
        await onSubmit(formData);
        setFormData({ title: '', description: '', dueDate: null, status: TaskStatus.PENDING }); // Clear form after creation
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.title.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="title">
          Title:
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="description">
          Description:
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="dueDate">
          Due Date:
        </label>
        <input
          type="datetime-local"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate ? (new Date(formData.dueDate).toISOString().slice(0, 16)) : ''}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="status">
          Status:
        </label>
        <select
          id="status"
          name="status"
          value={formData.status || TaskStatus.PENDING}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {Object.values(TaskStatus).map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
          (!isFormValid || loading) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Update Task' : 'Add Task'}
      </button>
    </form>
  );
};

export default TaskForm;