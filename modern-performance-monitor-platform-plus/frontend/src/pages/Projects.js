```javascript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../api';
import ProjectCard from '../components/common/ProjectCard';
import useAuth from '../hooks/useAuth';

const Projects = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.getProjects();
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectApi.deleteProject(projectId);
        fetchProjects(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete project:', err);
        alert('Failed to delete project.');
      }
    }
  };

  const handleGenerateApiKey = async (projectId) => {
    if (window.confirm('Are you sure you want to generate a new API key? The old key will no longer work.')) {
      try {
        const response = await projectApi.generateNewApiKey(projectId);
        // Update the specific project in the state with the new API key
        setProjects(prevProjects => prevProjects.map(proj =>
          proj.id === projectId ? { ...proj, api_key: response.data.api_key } : proj
        ));
        alert('New API Key generated successfully!');
      } catch (err) {
        console.error('Failed to generate new API key:', err);
        alert('Failed to generate new API key.');
      }
    }
  };

  if (authLoading || loading) {
    return <div className="text-center mt-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Projects</h1>
        <Link
          to="/projects/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md"
        >
          Create New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No projects yet. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              onGenerateApiKey={handleGenerateApiKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
```