```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as projectService from '../api/projects';
import TaskItem from '../components/TaskItem';

const ProjectDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const fetchProjectAndTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const projectData = await projectService.getProjectById(id);
      setProject(projectData);
      const tasksData = await projectService.getTasksByProject(id);
      setTasks(tasksData);
    } catch (err) {
      console.error("Failed to fetch project or tasks:", err.response?.data?.detail || err.message);
      setError(err.response?.data?.detail || "Failed to load project details.");
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/dashboard'); // Redirect if not found or unauthorized
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await projectService.createTask({
        title: newTaskTitle,
        description: newTaskDescription,
        project_id: parseInt(id),
        // assigned_to_id: user.id // Could auto-assign to current user
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      fetchProjectAndTasks();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
      console.error("Failed to create task:", err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setError('');
    try {
      await projectService.updateTask(taskId, { status: newStatus });
      fetchProjectAndTasks();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update task status.');
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setError('');
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await projectService.deleteTask(taskId);
        fetchProjectAndTasks();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete task.');
        console.error("Failed to delete task:", err);
      }
    }
  };

  if (loading) return <div className="container">Loading project...</div>;
  if (error) return <div className="container" style={{ color: 'red' }}>{error}</div>;
  if (!project) return <div className="container">Project not found.</div>;

  return (
    <div className="container">
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>Back to Dashboard</button>
      <h2>Project: {project.title}</h2>
      <p>{project.description}</p>
      <p>Owner: {project.owner_id}</p>

      <div className="dashboard-section">
        <h3>Create New Task</h3>
        <form onSubmit={handleCreateTask} className="auth-form">
          <input
            type="text"
            placeholder="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
            minLength="3"
            maxLength="100"
          />
          <textarea
            placeholder="Task Description (optional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            maxLength="1000"
          ></textarea>
          <button type="submit">Add Task</button>
        </form>
      </div>

      <div className="dashboard-section">
        <h3>Tasks for this Project</h3>
        {tasks.length > 0 ? (
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdateStatus={handleUpdateTaskStatus}
                onDelete={handleDeleteTask}
              />
            ))}
          </ul>
        ) : (
          <p>No tasks found for this project. Add one above!</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
```