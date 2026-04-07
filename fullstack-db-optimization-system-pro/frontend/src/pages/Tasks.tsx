import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@api/tasks';
import { databasesApi } from '@api/databases'; // To display database names
import { usersApi } from '@api/users'; // To display assignee names
import Table from '@components/Table';
import { Task, TaskCreate, TaskUpdate } from '@types';
import { TaskStatus } from '@types/auth';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@hooks/useAuth';

const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskCreate | TaskUpdate>({
    databaseId: 0,
    title: '',
    description: '',
    status: TaskStatus.PENDING,
    priority: 'Medium',
    dueDate: undefined,
    completedAt: undefined,
    suggestionId: undefined,
    assignedToId: user?.id, // Default to current user
  });

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getTasks,
  });

  const { data: allDatabases } = useQuery({
    queryKey: ['allDatabases'],
    queryFn: databasesApi.getDatabases,
    enabled: isModalOpen, // Only fetch when modal is open for selection
  });

  const { data: allUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: usersApi.getUsers,
    enabled: isModalOpen, // Only fetch when modal is open for selection
  });


  const createMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => alert(`Error creating task: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskUpdate }) =>
      tasksApi.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsModalOpen(false);
      setEditingTask(null);
      resetForm();
    },
    onError: (err: Error) => alert(`Error updating task: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: Error) => alert(`Error deleting task: ${err.message}`),
  });

  const getDatabaseName = (dbId: number | undefined) => {
    return allDatabases?.find(db => db.id === dbId)?.name || 'N/A';
  };

  const getAssigneeName = (userId: number | undefined) => {
    return allUsers?.find(u => u.id === userId)?.username || 'Unassigned';
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      databaseId: task.databaseId,
      suggestionId: task.suggestionId,
      assignedToId: task.assignedToId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : undefined,
      completedAt: task.completedAt ? new Date(task.completedAt).toISOString().slice(0, 16) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'databaseId' || name === 'suggestionId' || name === 'assignedToId') && value !== '' ? parseInt(value) : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData } as TaskCreate;
    if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
    if (payload.completedAt) payload.completedAt = new Date(payload.completedAt).toISOString();
    if (payload.suggestionId === 0) payload.suggestionId = undefined; // Handle empty select option
    if (payload.assignedToId === 0) payload.assignedToId = undefined;

    if (editingTask) {
      updateMutation.mutate({ taskId: editingTask.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const resetForm = () => {
    setFormData({
      databaseId: 0, // Reset to a default that forces selection
      title: '',
      description: '',
      status: TaskStatus.PENDING,
      priority: 'Medium',
      dueDate: undefined,
      completedAt: undefined,
      suggestionId: undefined,
      assignedToId: user?.id,
    });
  };

  const columns = [
    { header: 'Title', accessor: 'title', className: 'w-64' },
    { header: 'Database', accessor: (row: Task) => getDatabaseName(row.databaseId), className: 'w-40' },
    { header: 'Assignee', accessor: (row: Task) => getAssigneeName(row.assignedToId), className: 'w-32' },
    { header: 'Status', accessor: 'status', className: 'w-32' },
    { header: 'Priority', accessor: 'priority', className: 'w-24' },
    { header: 'Due Date', accessor: (row: Task) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A', className: 'w-32' },
    {
      header: 'Actions',
      accessor: (row: Task) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="text-indigo-600 hover:text-indigo-900 p-1">
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-900 p-1">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      className: 'w-24'
    },
  ];

  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Optimization Tasks</h1>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Create New Task
        </button>
      </div>

      <Table<Task>
        data={tasks || []}
        columns={columns}
        getKey={(task) => task.id}
        isLoading={isLoading}
        emptyMessage="No optimization tasks found."
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="databaseId" className="block text-sm font-medium text-gray-700">Database</label>
                <select
                  id="databaseId"
                  name="databaseId"
                  value={formData.databaseId}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a database</option>
                  {allDatabases?.map((db) => (
                    <option key={db.id} value={db.id}>{db.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.values(TaskStatus).map((status) => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="completedAt" className="block text-sm font-medium text-gray-700">Completed At</label>
                  <input
                    type="datetime-local"
                    id="completedAt"
                    name="completedAt"
                    value={formData.completedAt || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  value={formData.assignedToId || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {allUsers?.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="suggestionId" className="block text-sm font-medium text-gray-700">Link to Suggestion (Optional)</label>
                <input
                  type="number"
                  id="suggestionId"
                  name="suggestionId"
                  value={formData.suggestionId || ''}
                  onChange={handleFormChange}
                  placeholder="Suggestion ID"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;