```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProjectById, updateProject, deleteProject, getTasksByProjectId, createTask } from '@/api/projects';
import { getTaskById, updateTask, deleteTask } from '@/api/tasks';
import { Project, Task, CreateTaskData, UpdateTaskData, UpdateProjectData, User } from '@/utils/types';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import ProjectForm from '@/components/forms/ProjectForm';
import TaskForm from '@/components/forms/TaskForm';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/api/auth';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Omit<User, 'projects' | 'tasks'>[]>([]);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        const tasksData = await getTasksByProjectId(projectId);
        setTasks(tasksData);

        // Fetch all users for task assignment dropdown
        if (user) {
          const profile = await getUserProfile(); // Assuming profile returns all users associated or a user service to get all users
          // In a real app, you'd have a specific API endpoint for `getAllUsers` or `getProjectMembers`
          // For simplicity, we'll just add the current user as an available option.
          // A more robust solution would be an API call to get all users or users belonging to a team/organization.
          setAvailableUsers([
            { id: profile.id, username: profile.username, email: profile.email },
            ...(profile.projects || []).flatMap(p => p.tasks || []).map(t => t.assignedTo).filter((u): u is Omit<User, 'projects' | 'tasks'> => u !== null && u.id !== profile.id)
            // This is a crude way to get other users involved in *any* project that the current user owns.
            // A dedicated 'get all users' or 'get project members' API is needed.
          ]);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch project details.');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndTasks();
  }, [projectId, navigate, user]);

  const handleUpdateProject = async (data: UpdateProjectData) => {
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      const updated = await updateProject(projectId, data);
      setProject(updated);
      setIsEditingProject(false);
      toast.success('Project updated successfully!');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || !window.confirm('Are you sure you want to delete this project and all its tasks?')) return;
    setIsSubmitting(true);
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully!');
      navigate('/projects');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (data: CreateTaskData) => {
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      const newTask = await createTask(projectId, data);
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setIsCreatingTask(false);
      toast.success('Task created successfully!');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (taskId: string, data: UpdateTaskData) => {
    setIsSubmitting(true);
    try {
      const updated = await updateTask(taskId, data);
      setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? updated : t)));
      setEditingTaskId(null);
      toast.success('Task updated successfully!');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setIsSubmitting(true);
    try {
      await deleteTask(taskId);
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-lg">Loading project...</div>;
  }

  if (!project) {
    return <div className="text-center text-lg">Project not found.</div>;
  }

  const isOwner = user?.id === project.owner.id;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
        {isOwner && (
          <div className="space-x-2">
            <button onClick={() => setIsEditingProject(true)} className="btn-secondary">
              Edit Project
            </button>
            <button onClick={handleDeleteProject} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
              Delete Project
            </button>
          </div>
        )}
      </div>

      {isEditingProject && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
          <ProjectForm
            initialData={project}
            onSubmit={handleUpdateProject}
            onCancel={() => setIsEditingProject(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">Project Details</h2>
        <p className="text-gray-700 mb-2">{project.description || 'No description provided.'}</p>
        <p className="text-sm text-gray-500">
          Owner: <span className="font-medium">{project.owner.username}</span> | Created:{' '}
          {dayjs(project.createdAt).format('MMM D, YYYY HH:mm')}
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tasks ({tasks.length})</h2>
        {isOwner && (
          <button onClick={() => setIsCreatingTask(true)} className="btn-primary">
            Add New Task
          </button>
        )}
      </div>

      {isCreatingTask && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
          <TaskForm
            availableUsers={availableUsers}
            onSubmit={handleCreateTask}
            onCancel={() => setIsCreatingTask(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-gray-600 text-center text-lg">No tasks for this project yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <li key={task.id} className="card relative">
              {editingTaskId === task.id ? (
                <TaskForm
                  initialData={task}
                  availableUsers={availableUsers}
                  onSubmit={(data) => handleUpdateTask(task.id, data)}
                  onCancel={() => setEditingTaskId(null)}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <>
                  <Link to={`/tasks/${task.id}`} className="block hover:text-indigo-600 transition duration-150 ease-in-out">
                    <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-1">
                    Status: <span className={`font-medium ${
                      task.status === 'completed' ? 'text-green-600' :
                      task.status === 'in_progress' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {task.status.replace(/_/g, ' ').charAt(0).toUpperCase() + task.status.replace(/_/g, ' ').slice(1)}
                    </span>
                  </p>
                  {task.dueDate && (
                    <p className="text-gray-600 text-sm mb-1">
                      Due: {dayjs(task.dueDate).format('MMM D, YYYY HH:mm')}
                    </p>
                  )}
                  {task.assignedTo && (
                    <p className="text-gray-600 text-sm mb-1">Assigned to: {task.assignedTo.username}</p>
                  )}
                  <p className="text-gray-600 text-sm mt-2">{task.description}</p>
                  {isOwner && (
                    <div className="absolute top-4 right-4 space-x-2">
                      <button
                        onClick={() => setEditingTaskId(task.id)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                        disabled={isSubmitting}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                        disabled={isSubmitting}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectDetailPage;
```