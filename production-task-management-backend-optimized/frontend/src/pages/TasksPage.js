```javascript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import TaskForm from '../components/forms/TaskForm';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const statusColors = {
  TODO: 'bg-gray-200 text-gray-800',
  IN_PROGRESS: 'bg-blue-200 text-blue-800',
  DONE: 'bg-green-200 text-green-800',
  BLOCKED: 'bg-red-200 text-red-800',
};

const priorityColors = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-700 font-bold',
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const { user } = useAuth();

  // For TaskForm to select assignees, we need project members.
  // We'll fetch all projects and their members once.
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(''); // For new task or filtering

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedProjectId) {
        queryParams.append('projectId', selectedProjectId);
      }
      const response = await api.get(`/tasks?${queryParams.toString()}`);
      setTasks(response.data.tasks);
    } catch (err) {
      setError('Failed to load tasks.');
      toast.error('Failed to load tasks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      const response = await api.get('/projects?limit=1000'); // Fetch all projects for selection
      setAllProjects(response.data.projects);
    } catch (err) {
      console.error('Failed to load all projects:', err);
      toast.error('Failed to load project list for task creation/filter.');
    }
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId]); // Re-fetch tasks when filter changes

  const handleCreateTask = () => {
    setCurrentTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully!');
        fetchTasks();
      } catch (err) {
        toast.error('Failed to delete task.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async () => {
    setIsModalOpen(false);
    await fetchTasks();
  };

  const currentProjectMembers = allProjects.find(p => p.id === (currentTask?.projectId || selectedProjectId))?.members || [];

  if (loading) return <div className="p-6 text-center">Loading tasks...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Projects</option>
            {allProjects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <button
            onClick={handleCreateTask}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-600 text-lg">No tasks found. Start by creating one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500 flex flex-col justify-between">
              <Link to={`/tasks/${task.id}`} className="block flex-grow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description || 'No description'}</p>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`font-medium ${priorityColors[task.priority]}`}>
                    {task.priority} Priority
                  </span>
                </div>
                <div className="flex items-center text-gray-500 text-sm mt-2">
                  <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                  <span>Project: {task.project.name}</span>
                </div>
                {task.assignee && (
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>Assignee: {task.assignee.firstName || task.assignee.email}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    <span>Due: {dayjs(task.dueDate).format('MMM DD, YYYY')}</span>
                  </div>
                )}
              </Link>
              { (task.creatorId === user.id || allProjects.find(p => p.id === task.projectId)?.ownerId === user.id) && (
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                    title="Edit Task"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Task"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTask ? 'Edit Task' : 'Create New Task'}>
        <TaskForm
          projectId={currentTask?.projectId || selectedProjectId || undefined} // Pass selected or current project
          task={currentTask}
          projectMembers={currentTask ? allProjects.find(p => p.id === currentTask.projectId)?.members || [] : allProjects.find(p => p.id === selectedProjectId)?.members || []}
          allProjects={allProjects} // Pass all projects for project selection if currentTask is null
          onSuccess={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default TasksPage;
```