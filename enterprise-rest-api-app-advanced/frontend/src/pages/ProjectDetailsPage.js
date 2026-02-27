import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, getTasksByProjectId, createTask, updateTask, deleteTask } from '../api/projectPulseApi';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { useAuth } from '../hooks/useAuth';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [createTaskError, setCreateTaskError] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      const projectResponse = await getProjectById(id);
      setProject(projectResponse.data);

      const tasksResponse = await getTasksByProjectId(id);
      setTasks(tasksResponse.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details.');
      console.error('Error fetching project or tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateTaskLoading(true);
    setCreateTaskError(null);
    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDescription,
        projectId: parseInt(id),
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowCreateTaskForm(false);
      fetchProjectAndTasks(); // Refresh tasks
    } catch (err) {
      setCreateTaskError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreateTaskLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, currentStatus) => {
    const nextStatus = {
      'PENDING': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'PENDING', // Allow cycling back for demo
      'BLOCKED': 'PENDING'
    }[currentStatus];

    if (!nextStatus) return;

    try {
      await updateTask(taskId, { status: nextStatus });
      fetchProjectAndTasks(); // Refresh tasks
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status.');
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        fetchProjectAndTasks(); // Refresh tasks
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete task.');
        console.error('Error deleting task:', err);
      }
    }
  };

  const isProjectCreator = project && user && project.createdBy?.id === user.id;
  const isAdmin = user && user.role === 'ADMIN';

  const isAuthorizedToModifyTask = (task) => {
    if (!user) return false;
    return isAdmin || isProjectCreator || (task.assignedTo && task.assignedTo.id === user.id);
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  if (error) {
    return <div className="alert-error">Error: {error}</div>;
  }

  if (!project) {
    return <div className="alert-error">Project not found.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">{project.name}</h1>
        <Button onClick={() => navigate('/projects')} variant="secondary">Back to Projects</Button>
      </div>

      <div className="card mb-6">
        <p className="text-gray-700">{project.description || 'No description provided.'}</p>
        <p className="text-gray-600 text-sm mt-2">
          Created by: {project.createdBy?.username || 'N/A'} on {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-6">Tasks</h2>

      {(isProjectCreator || isAdmin) && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setShowCreateTaskForm(!showCreateTaskForm)} variant="secondary">
            {showCreateTaskForm ? 'Cancel' : 'Add New Task'}
          </Button>
        </div>
      )}

      {showCreateTaskForm && (
        <div className="card mb-6">
          <h3 className="text-2xl font-bold mb-4">New Task for {project.name}</h3>
          <form onSubmit={handleCreateTask}>
            {createTaskError && <div className="alert-error">{createTaskError}</div>}
            <InputField
              label="Task Title"
              id="newTaskTitle"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
            <InputField
              label="Description"
              id="newTaskDescription"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              type="textarea"
            />
            <Button type="submit" disabled={createTaskLoading} className="mt-4">
              {createTaskLoading ? <Spinner size="sm" /> : 'Add Task'}
            </Button>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-gray-600">No tasks for this project yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <li key={task.id} className="card flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-semibold">{task.title}</h4>
                <p className="text-gray-700 text-sm mt-1">{task.description || 'No description.'}</p>
                <p className="text-gray-600 text-sm mt-2">Status: <span className={`font-medium ${
                  task.status === 'COMPLETED' ? 'text-green-600' :
                  task.status === 'IN_PROGRESS' ? 'text-blue-600' :
                  task.status === 'BLOCKED' ? 'text-red-600' : 'text-yellow-600'
                }`}>{task.status}</span></p>
                <p className="text-gray-600 text-sm">Assigned To: {task.assignedTo?.username || 'Unassigned'}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isAuthorizedToModifyTask(task) && (
                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                    variant="secondary"
                    className="flex-grow"
                  >
                    Change Status
                  </Button>
                  {(isProjectCreator || isAdmin) && ( // Only project creator or admin can delete tasks
                    <Button variant="danger" onClick={() => handleDeleteTask(task.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
```
**`frontend/src/pages/NotFoundPage.js`**
```javascript