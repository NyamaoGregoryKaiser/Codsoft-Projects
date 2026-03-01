import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/outline';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null); // For edit functionality
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks and comments.')) {
      return;
    }
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project.');
    }
  };

  const openCreateModal = () => {
    setCurrentProject(null);
    setNewProjectTitle('');
    setNewProjectDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setCurrentProject(project);
    setNewProjectTitle(project.title);
    setNewProjectDescription(project.description);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const projectData = {
      title: newProjectTitle,
      description: newProjectDescription,
    };

    try {
      if (currentProject) {
        // Update existing project
        const response = await api.put(`/projects/${currentProject.id}`, projectData);
        setProjects(
          projects.map((p) => (p.id === currentProject.id ? response.data : p))
        );
      } else {
        // Create new project
        const response = await api.post('/projects/', projectData);
        setProjects([...projects, response.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save project:', err);
      setError('Failed to save project.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner size="h-10 w-10" color="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Your Projects</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10">No projects found. Start by creating a new one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-6 bg-white w-full max-w-md mx-auto rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              {currentProject ? 'Edit Project' : 'Create New Project'}
            </h3>
            <form onSubmit={handleModalSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
```