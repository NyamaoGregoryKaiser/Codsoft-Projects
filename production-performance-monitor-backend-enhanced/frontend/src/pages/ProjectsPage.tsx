```typescript
import React, { useState, useEffect } from 'react';
import { getMyProjects, createProject, updateProject, deleteProject } from '../services/api';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await getMyProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleOpenModal = (project?: Project) => {
    setCurrentProject(project || null);
    setProjectName(project ? project.name : '');
    setProjectDescription(project ? project.description || '' : '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProject(null);
    setProjectName('');
    setProjectDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (currentProject) {
        // Update project
        await updateProject(currentProject.id, {
          ...currentProject,
          name: projectName,
          description: projectDescription,
        });
      } else {
        // Create project
        await createProject({ name: projectName, description: projectDescription });
      }
      fetchProjects();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project.');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
        fetchProjects();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  if (loading) return <div className="text-center p-4">Loading projects...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600">You don't have any projects yet. Start by creating one!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="w-full bg-gray-100 border-b">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{project.name}</td>
                  <td className="px-4 py-3 text-gray-600">{project.description || 'No description'}</td>
                  <td className="px-4 py-3 flex space-x-2">
                    <button
                      onClick={() => navigate(`/projects/${project.id}/tasks`)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                      title="View Tasks"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100"
                      title="Edit Project"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                      title="Delete Project"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {currentProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-gray-700 text-sm font-bold mb-2">
                  Project Name:
                </label>
                <input
                  type="text"
                  id="projectName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="projectDescription" className="block text-gray-700 text-sm font-bold mb-2">
                  Description:
                </label>
                <textarea
                  id="projectDescription"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {currentProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
```