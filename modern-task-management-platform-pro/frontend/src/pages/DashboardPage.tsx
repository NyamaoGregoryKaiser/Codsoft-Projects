```typescript
import React, { useState } from 'react';
import { useProjects } from 'hooks/useProjects';
import ProjectCard from 'components/ProjectCard';
import Modal from 'components/Modal';
import Pagination from 'components/Pagination';
import { Project } from 'types';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    pagination,
  } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null); // For edit
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateNewProject = () => {
    setCurrentProject(null);
    setProjectName('');
    setProjectDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!projectName.trim()) {
      setFormError('Project name cannot be empty.');
      return;
    }

    try {
      if (currentProject) {
        // Update existing project
        await updateProject(currentProject.id, projectName, projectDescription);
      } else {
        // Create new project
        await createProject(projectName, projectDescription);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save project.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
      try {
        await deleteProject(projectId);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchProjects(page, pagination.limit);
  };

  if (loading && projects.length === 0) return <div className="loading-state">Loading projects...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="dashboard-page-container">
      <header className="dashboard-header">
        <h1>Your Projects</h1>
        <button onClick={handleCreateNewProject} className="btn primary-btn">
          Create New Project
        </button>
      </header>

      <section className="projects-list">
        {projects.length === 0 && !loading ? (
          <p className="no-content-message">No projects found. Start by creating a new one!</p>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))
        )}
      </section>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentProject ? 'Edit Project' : 'Create New Project'}>
        <form onSubmit={handleSaveProject} className="project-form">
          {formError && <p className="error-message">{formError}</p>}
          <div className="form-group">
            <label htmlFor="projectName">Project Name:</label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              aria-label="Project Name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="projectDescription">Description:</label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              aria-label="Project Description"
            ></textarea>
          </div>
          <button type="submit" className="btn primary-btn">
            {currentProject ? 'Update Project' : 'Create Project'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
```