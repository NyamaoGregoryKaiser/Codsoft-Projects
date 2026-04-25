```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTaskById, updateTask, deleteTask } from '@/api/tasks';
import { Task, UpdateTaskData, User } from '@/utils/types';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import TaskForm from '@/components/forms/TaskForm';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/api/auth';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Omit<User, 'projects' | 'tasks'>[]>([]);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      setLoading(true);
      try {
        const taskData = await getTaskById(taskId);
        setTask(taskData);

        // Fetch all users for task assignment dropdown
        if (user) {
          const profile = await getUserProfile();
          setAvailableUsers([
            { id: profile.id, username: profile.username, email: profile.email },
            ...(profile.projects || []).flatMap(p => p.tasks || []).map(t => t.assignedTo).filter((u): u is Omit<User, 'projects' | 'tasks'> => u !== null && u.id !== profile.id)
            // Same crude user fetching as in ProjectDetailPage. Needs proper API.
          ]);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch task details.');
        navigate('/projects'); // Redirect to projects if task not found or unauthorized
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, navigate, user]);

  const handleUpdateTask = async (data: UpdateTaskData) => {
    if (!taskId) return;
    setIsSubmitting(true);
    try {
      const updated = await updateTask(taskId, data);
      setTask(updated);
      setIsEditingTask(false);
      toast.success('Task updated successfully!');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId || !window.confirm('Are you sure you want to delete this task?')) return;
    setIsSubmitting(true);
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully!');
      // Navigate back to the project detail page or projects list
      navigate(task?.project ? `/projects/${task.project.id}` : '/projects');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-lg">Loading task...</div>;
  }

  if (!task) {
    return <div className="text-center text-lg">Task not found.</div>;
  }

  const isOwner = user?.id === task.project?.owner.id;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
        {isOwner && (
          <div className="space-x-2">
            <button onClick={() => setIsEditingTask(true)} className="btn-secondary">
              Edit Task
            </button>
            <button onClick={handleDeleteTask} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
              Delete Task
            </button>
          </div>
        )}
      </div>

      {isEditingTask && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
          <TaskForm
            initialData={task}
            availableUsers={availableUsers}
            onSubmit={handleUpdateTask}
            onCancel={() => setIsEditingTask(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">Task Details</h2>
        <p className="text-gray-700 mb-2">{task.description || 'No description provided.'}</p>
        <p className="text-gray-700 mb-2">
          Status: <span className={`font-semibold ${
            task.status === 'completed' ? 'text-green-600' :
            task.status === 'in_progress' ? 'text-blue-600' :
            'text-yellow-600'
          }`}>
            {task.status.replace(/_/g, ' ').charAt(0).toUpperCase() + task.status.replace(/_/g, ' ').slice(1)}
          </span>
        </p>
        {task.dueDate && (
          <p className="text-gray-700 mb-2">
            Due Date: {dayjs(task.dueDate).format('MMMM D, YYYY HH:mm')}
          </p>
        )}
        {task.assignedTo && (
          <p className="text-gray-700 mb-2">Assigned To: {task.assignedTo.username}</p>
        )}
        {task.project && (
          <p className="text-gray-700 mb-2">
            Project: <Link to={`/projects/${task.project.id}`} className="text-indigo-600 hover:underline">{task.project.name}</Link>
          </p>
        )}
        <p className="text-sm text-gray-500 mt-4">
          Created: {dayjs(task.createdAt).format('MMM D, YYYY HH:mm')} | Last Updated:{' '}
          {dayjs(task.updatedAt).format('MMM D, YYYY HH:mm')}
        </p>
      </div>

      <div className="mt-8">
        <Link to={task.project ? `/projects/${task.project.id}` : '/projects'} className="btn-secondary">
          Back to {task.project ? 'Project Details' : 'Projects List'}
        </Link>
      </div>
    </div>
  );
};

export default TaskDetailPage;
```