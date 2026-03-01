import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // For edit functionality
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigned_to_id: '',
  });
  const [users, setUsers] = useState([]); // For assigning tasks

  useEffect(() => {
    fetchProjectAndTasks();
    fetchUsers();
  }, [projectId]);

  const fetchProjectAndTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectResponse = await api.get(`/projects/${projectId}`);
      setProject(projectResponse.data);
      setTasks(projectResponse.data.tasks); // Tasks are nested in project detail response
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setError('Failed to load project details or tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users'); // Assuming this endpoint is accessible or adjust
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users for assignment:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone and will delete all associated comments.')) {
      return;
    }
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task.');
    }
  };

  const openCreateTaskModal = () => {
    setCurrentTask(null);
    setTaskForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigned_to_id: '',
    });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setCurrentTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to_id: task.assigned_to_id || '',
    });
    setIsTaskModalOpen(true);
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskModalSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...taskForm,
      assigned_to_id: taskForm.assigned_to_id === '' ? null : parseInt(taskForm.assigned_to_id),
    };

    try {
      if (currentTask) {
        // Update existing task
        const response = await api.put(`/tasks/${currentTask.id}`, payload);
        setTasks(tasks.map((t) => (t.id === currentTask.id ? response.data : t)));
      } else {
        // Create new task
        const response = await api.post('/tasks/', { ...payload, project_id: parseInt(projectId) });
        setTasks([...tasks, response.data]);
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      setError(err.response?.data?.detail || 'Failed to save task.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner size="h-10 w-10" color="text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center text-gray-600 text-lg mt-10">Project not found.</div>;
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{project.title}</h1>
        <p className="text-lg text-gray-700 mb-4">{project.description}</p>
        <div className="text-sm text-gray-500">
          Created: {formatDate(project.created_at)} | Last Updated: {formatDate(project.updated_at)}
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-900">Tasks</h2>
        <button
          onClick={openCreateTaskModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Task
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10">No tasks found for this project. Add one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              projectId={projectId}
              task={task}
              onDelete={handleDeleteTask}
              onEdit={openEditTaskModal}
            />
          ))}
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white w-full max-w-md mx-auto rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              {currentTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form onSubmit={handleTaskModalSubmit}>
              <div className="mb-4">
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="task-title"
                  name="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={taskForm.title}
                  onChange={handleTaskFormChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="task-description"
                  name="description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={taskForm.description}
                  onChange={handleTaskFormChange}
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="task-status"
                  name="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={taskForm.status}
                  onChange={handleTaskFormChange}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="task-priority"
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={taskForm.priority}
                  onChange={handleTaskFormChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="assigned_to_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  id="assigned_to_id"
                  name="assigned_to_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={taskForm.assigned_to_id}
                  onChange={handleTaskFormChange}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailsPage;
```