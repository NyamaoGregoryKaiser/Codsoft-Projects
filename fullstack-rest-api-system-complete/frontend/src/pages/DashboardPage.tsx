import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { projectApi } from '../services/api';
import ProjectCard from '../components/ProjectCard';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getAllProjects();
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    setError(null);
    if (!newProjectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    try {
      await projectApi.createProject({ name: newProjectName, description: newProjectDescription });
      setNewProjectName('');
      setNewProjectDescription('');
      fetchProjects(); // Refresh project list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setError(null);
    if (!window.confirm('Are you sure you want to delete this project? All tasks and comments will be lost.')) {
      return;
    }
    try {
      await projectApi.deleteProject(projectId);
      fetchProjects(); // Refresh project list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleEditProject = (project: Project) => {
    // Implement modal or navigate to edit page
    alert(`Editing project: ${project.name}`);
  };

  if (loading) {
    return <div className="text-center p-8">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Project</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Project Description (optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <button
              onClick={handleCreateProject}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">My Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-600">You don't have any projects yet. Create one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
                onEdit={handleEditProject}
                isOwner={project.owner.id === user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;