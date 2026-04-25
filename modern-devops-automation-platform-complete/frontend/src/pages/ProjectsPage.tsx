```typescript
import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '@/api/projects';
import { Project, CreateProjectData } from '@/utils/types';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import ProjectForm from '@/components/forms/ProjectForm';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (data: CreateProjectData) => {
    setIsSubmitting(true);
    try {
      const newProject = await createProject(data);
      setProjects((prev) => [...prev, newProject]);
      setIsCreatingProject(false);
      toast.success('Project created successfully!');
    } catch (error: any) {
      // Error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-lg">Loading projects...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
        <button onClick={() => setIsCreatingProject(true)} className="btn-primary">
          Create New Project
        </button>
      </div>

      {isCreatingProject && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreatingProject(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {projects.length === 0 ? (
        <p className="text-gray-600 text-center text-lg">No projects created yet. Start by creating one!</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <li key={project.id} className="card hover:shadow-lg transition-shadow duration-200">
              <Link to={`/projects/${project.id}`} className="block">
                <h2 className="text-2xl font-semibold text-indigo-600 mb-2">{project.name}</h2>
                <p className="text-gray-700 mb-3">{project.description || 'No description provided.'}</p>
                <p className="text-sm text-gray-500">
                  Created: {dayjs(project.createdAt).format('MMM D, YYYY HH:mm')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectsPage;
```