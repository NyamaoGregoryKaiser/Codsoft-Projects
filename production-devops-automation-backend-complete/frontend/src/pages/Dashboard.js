```javascript
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/projects');
      setProjects(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/v1/projects', {
        name: newProjectName,
        description: newProjectDescription,
      });
      setNewProjectName('');
      setNewProjectDescription('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (id) => {
    setError('');
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/api/v1/projects/${id}`);
        fetchProjects();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  const handleEditProject = (id) => {
    // In a real app, this would open a modal or navigate to an edit page
    alert(`Editing project ${id} - functionality not fully implemented yet.`);
  };

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user?.username || 'Guest'}!</h2>

      <div className="create-project-form">
        <h3>Create New Project</h3>
        <form onSubmit={handleCreateProject}>
          <div>
            <label htmlFor="projectName">Project Name:</label>
            <input
              type="text"
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="projectDescription">Description:</label>
            <textarea
              id="projectDescription"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
            />
          </div>
          <button type="submit">Create Project</button>
        </form>
      </div>

      <h3 style={{ marginTop: '20px' }}>Your Projects</h3>
      <div className="project-list">
        {projects.length === 0 ? (
          <p>No projects found. Create one above!</p>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              onEdit={handleEditProject}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
```