```javascript
import React, { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard';
import * as projectService from '../api/projects';

const Dashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err.response?.data?.detail || err.message);
      setError("Failed to load projects.");
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await projectService.createProject({ 
        title: newProjectTitle, 
        description: newProjectDescription 
      });
      setNewProjectTitle('');
      setNewProjectDescription('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.');
      console.error("Failed to create project:", err);
    }
  };

  const handleDeleteProject = async (id) => {
    setError('');
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(id);
        fetchProjects();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete project.');
        console.error("Failed to delete project:", err);
      }
    }
  };

  const handleUpdateProject = (id) => {
    // In a real app, this would open a modal or navigate to an edit page
    const projectToEdit = projects.find(p => p.id === id);
    if (projectToEdit) {
      const newTitle = prompt('Enter new title:', projectToEdit.title);
      const newDescription = prompt('Enter new description:', projectToEdit.description);
      if (newTitle !== null && newDescription !== null) {
        projectService.updateProject(id, { title: newTitle, description: newDescription })
          .then(fetchProjects)
          .catch(err => {
            setError(err.response?.data?.detail || 'Failed to update project.');
            console.error("Failed to update project:", err);
          });
      }
    }
  };

  return (
    <div className="container">
      <h2>Welcome to your Dashboard, {user?.full_name || user?.email}!</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="dashboard-section">
        <h2>Create New Project</h2>
        <form onSubmit={handleCreateProject} className="auth-form"> {/* Re-using auth-form style */}
          <input
            type="text"
            placeholder="Project Title"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            required
            minLength="3"
            maxLength="100"
          />
          <textarea
            placeholder="Project Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            maxLength="1000"
          ></textarea>
          <button type="submit">Create Project</button>
        </form>
      </div>

      <div className="dashboard-section">
        <h2>Your Projects</h2>
        <div className="project-grid">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleDeleteProject} 
                onUpdate={handleUpdateProject}
              />
            ))
          ) : (
            <p>No projects found. Create one above!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```