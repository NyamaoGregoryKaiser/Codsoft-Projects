import React, { useEffect, useState } from 'react';
import apiClient from '../api';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'member';
}

interface ProjectsProps {
  user: User | null;
}

const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/projects');
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatingProject(true);
    try {
      const response = await apiClient.post('/projects', {
        name: newProjectName,
        description: newProjectDescription,
      });
      setProjects([...projects, response.data]);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setError('');
    try {
      await apiClient.delete(`/projects/${id}`);
      setProjects(projects.filter((project) => project.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading projects...</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Projects</h1>

      <form onSubmit={handleCreateProject} className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Create New Project</h2>
        <div className="mb-4">
          <label htmlFor="projectName" className="block text-gray-700 text-sm font-bold mb-2">
            Project Name
          </label>
          <input
            type="text"
            id="projectName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
            disabled={creatingProject}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="projectDescription" className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            id="projectDescription"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            rows={3}
            disabled={creatingProject}
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          disabled={creatingProject}
        >
          {creatingProject ? 'Creating...' : 'Create Project'}
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="text-gray-600">No projects found. Create one above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{project.description || 'No description provided.'}</p>
              <div className="text-xs text-gray-500 mb-4">
                <p>Created by: {project.createdByUsername}</p>
                <p>Created at: {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-end space-x-2">
                {user && (user.id === project.createdById || user.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Delete
                  </button>
                )}
                {/* Add Edit/View Tasks buttons here */}
                <button
                  onClick={() => alert(`View Tasks for ${project.name}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  View Tasks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;