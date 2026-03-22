```javascript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import ProjectForm from '../components/forms/ProjectForm';
import { useAuth } from '../context/AuthContext';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null); // For editing
  const { user } = useAuth(); // To check if current user is owner for actions

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.projects);
    } catch (err) {
      setError('Failed to load projects.');
      toast.error('Failed to load projects.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = () => {
    setCurrentProject(null); // Clear for new creation
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    setCurrentProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      try {
        await api.delete(`/projects/${projectId}`);
        toast.success('Project deleted successfully!');
        fetchProjects(); // Refresh list
      } catch (err) {
        toast.error('Failed to delete project.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async () => {
    setIsModalOpen(false);
    await fetchProjects();
  };

  if (loading) return <div className="p-6 text-center">Loading projects...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
        <button
          onClick={handleCreateProject}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600 text-lg">You are not part of any projects yet. Start by creating one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description || 'No description'}</p>
              <div className="flex items-center text-gray-500 text-xs mb-4">
                <UserIcon className="h-4 w-4 mr-1" />
                <span>Owner: {project.owner.firstName || project.owner.email}</span>
                <span className="ml-4">Members: {project.members.length}</span>
              </div>

              <div className="flex justify-end space-x-2">
                <Link
                  to={`/projects/${project.id}`}
                  className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors"
                  title="View Project"
                >
                  <EyeIcon className="h-5 w-5" />
                </Link>
                {/* Only owner can edit/delete */}
                {project.ownerId === user.id && (
                  <>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                      title="Edit Project"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete Project"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentProject ? 'Edit Project' : 'Create New Project'}>
        <ProjectForm
          project={currentProject}
          onSuccess={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ProjectsPage;
```