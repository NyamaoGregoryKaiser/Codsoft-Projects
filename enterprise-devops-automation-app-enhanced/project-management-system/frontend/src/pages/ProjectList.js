```javascript
import React, { useState, useEffect } from 'react';
import * as projectApi from '../api/projects';
import ProjectCard from '../components/ProjectCard';
import './ProjectList.css';

function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectApi.getProjects();
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      alert('Project name cannot be empty.');
      return;
    }
    try {
      await projectApi.createProject({ name: newProjectName, description: newProjectDescription });
      setNewProjectName('');
      setNewProjectDescription('');
      fetchProjects(); // Refresh the list
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };


  if (loading) return <div className="loading-message">Loading projects...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="project-list-page">
      <h1>My Projects</h1>

      <section className="create-project-section">
        <h2>Create New Project</h2>
        <form onSubmit={handleCreateProject} className="create-project-form">
          <input
            type="text"
            placeholder="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
          />
          <textarea
            placeholder="Project Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          ></textarea>
          <button type="submit">Create Project</button>
        </form>
      </section>

      <section className="existing-projects-section">
        <h2>Existing Projects</h2>
        {projects.length > 0 ? (
          <div className="project-cards-container">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p>No projects found. Create one above!</p>
        )}
      </section>
    </div>
  );
}

export default ProjectListPage;
```