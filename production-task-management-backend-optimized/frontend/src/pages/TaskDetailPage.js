```javascript
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon, UserIcon, CalendarDaysIcon, TagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]); // Needed for TaskForm assignee selection
  const [projectOwnerId, setProjectOwnerId] = useState(null);

  const fetchTaskAndProjectDetails = async () => {
    try {
      setLoading(true);
      const taskRes = await api.get(`/tasks/${taskId}`);
      setTask(taskRes.data);

      // Fetch project details to get members and owner for authorization
      const projectRes = await api.get(`/projects/${taskRes.data.projectId}`);
      setProjectMembers(projectRes.data.members);
      setProjectOwnerId(projectRes.data.ownerId);

    } catch (err) {
      setError('Failed to load task details.');
      toast.error('Failed to load task details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndProjectDetails();
  }, [taskId]);

  const handleEditTask = () => {
    setIsModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully!');
        navigate(`/projects/${task.projectId}`); // Navigate back to project tasks
      } catch (err) {
        toast.error('Failed to delete task.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = () => {
    setIsModalOpen(false);
    fetchTaskAndProjectDetails(); // Refresh task data
  };

  if (loading) return <div className="p-6 text-center">Loading task...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!task) return <div className="p-6 text-center">Task not found.</div>;

  const canEditOrDelete = user.id === task.creatorId || user.id === projectOwnerId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-indigo-600">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          {canEditOrDelete && (
            <div className="flex space-x-2">
              <button
                onClick={handleEditTask}
                className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                title="Edit Task"
              >
                <PencilIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleDeleteTask}
                className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                title="Delete Task"
              >
                <TrashIcon className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>

        <p className="text-gray-700 text-lg mb-6">{task.description || 'No description provided.'}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center text-gray-700">
            <TagIcon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Project:</span>
            <Link to={`/projects/${task.project.id}`} className="ml-2 text-indigo-600 hover:underline">
              {task.project.name}
            </Link>
          </div>
          <div className="flex items-center text-gray-700">
            <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Assignee:</span>
            <span className="ml-2">{task.assignee?.firstName || task.assignee?.email || 'Unassigned'}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Creator:</span>
            <span className="ml-2">{task.creator?.firstName || task.creator?.email}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Status:</span>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${statusColors[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Priority:</span>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm ${priorityColors[task.priority]} border border-current`}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Due Date:</span>
            <span className="ml-2">{task.dueDate ? dayjs(task.dueDate).format('MMM DD, YYYY') : 'Not set'}</span>
          </div>
        </div>

        <div className="text-gray-500 text-sm mt-8 border-t pt-4">
          <p>Created: {dayjs(task.createdAt).format('MMM DD, YYYY HH:mm')}</p>
          <p>Last Updated: {dayjs(task.updatedAt).format('MMM DD, YYYY HH:mm')}</p>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Task">
        <TaskForm
          projectId={task.projectId}
          task={task}
          projectMembers={projectMembers}
          onSuccess={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default TaskDetailPage;
```