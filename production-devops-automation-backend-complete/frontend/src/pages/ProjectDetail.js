```javascript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import TaskItem from '../components/TaskItem';

function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  useEffect(() => {
    fetchProjectDetail();
  }, [projectId]);

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/api/v1/projects/${projectId}/tasks`, {
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'pending', // Default status
        priority: 'medium', // Default priority
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      fetchProjectDetail(); // Re-fetch project to update tasks list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    setError('');
    try {
      await api.put(`/api/v1/projects/${projectId}/tasks/${taskId}`, updates);
      fetchProjectDetail(); // Re-fetch project to update tasks list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    setError('');
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/api/v1/projects/${projectId}/tasks/${taskId}`);
        fetchProjectDetail(); // Re-fetch project to update tasks list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  if (loading) return <p>Loading project details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div className="project-detail-container">
      <h2>Project: {project.name}</h2>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Status:</strong> {project.status}</p>
      <p><strong>Owner:</strong> {project.owner.username}</p>

      <div className="create-task-form">
        <h3>Add New Task</h3>
        <form onSubmit={handleCreateTask}>
          <div>
            <label htmlFor="taskTitle">Task Title:</label>
            <input
              type="text"
              id="taskTitle"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="taskDescription">Description:</label>
            <textarea
              id="taskDescription"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
            />
          </div>
          <button type="submit">Add Task</button>
        </form>
      </div>

      <h3 style={{ marginTop: '20px' }}>Tasks</h3>
      <div className="task-list">
        {project.tasks.length === 0 ? (
          <p>No tasks yet for this project. Add one above!</p>
        ) : (
          project.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
```