import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({ id: null, name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateClick = () => {
    setIsEditing(false);
    setCurrentProject({ id: null, name: '', description: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditClick = (project) => {
    setIsEditing(true);
    setCurrentProject(project);
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project? All associated tasks will also be deleted.")) {
      return;
    }
    try {
      await api.delete(`/projects/${projectId}`);
      alert("Project deleted successfully!");
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError(err.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentProject({ id: null, name: '', description: '' });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setCurrentProject((prev) => ({ ...prev, [id]: value }));
    setFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    if (!currentProject.name) errors.name = "Project name is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing) {
        await api.put(`/projects/${currentProject.id}`, {
          name: currentProject.name,
          description: currentProject.description,
        });
        alert("Project updated successfully!");
      } else {
        await api.post('/projects', currentProject);
        alert("Project created successfully!");
      }
      handleModalClose();
      fetchProjects();
    } catch (err) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} project:`, err);
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} project.`);
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-48" />;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Button onClick={handleCreateClick}>
          <PlusIcon className="h-5 w-5 mr-2" /> Create New Project
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10">No projects found. Create your first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              currentUser={user}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={isEditing ? 'Edit Project' : 'Create Project'}
        onSubmit={handleSubmit}
        submitText={isEditing ? 'Update Project' : 'Create Project'}
      >
        <Input
          label="Project Name"
          id="name"
          value={currentProject.name}
          onChange={handleInputChange}
          error={formErrors.name}
          required
        />
        <Input
          label="Description"
          id="description"
          value={currentProject.description}
          onChange={handleInputChange}
          error={formErrors.description}
          type="textarea" // Note: This would typically be a <textarea> not an <input type="textarea">
        />
      </Modal>
    </div>
  );
};

export default ProjectsPage;