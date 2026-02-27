import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProjects, createProject, deleteProject } from '../api/projectPulseApi';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { useAuth } from '../hooks/useAuth';

const ProjectListPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user for authorization checks

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getAllProjects();
      setProjects(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects.');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateProjectLoading(true);
    setCreateProjectError(null);
    try {
      await createProject({ name: newProjectName, description: newProjectDescription });
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
      fetchProjects(); // Refresh the list
    } catch (err) {
      setCreateProjectError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreateProjectLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      try {
        await deleteProject(projectId);
        fetchProjects(); // Refresh list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete project.');
        console.error('Error deleting project:', err);
      }
    }
  };

  const isAuthorizedToModify = (projectCreatedById) => {
    if (!user) return false;
    return user.role === 'ADMIN' || user.id === projectCreatedById;
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Projects</h1>

      <div className="mb-6 flex justify-between items-center">
        <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="secondary">
          {showCreateForm ? 'Cancel' : 'Create New Project'}
        </Button>
      </div>

      {showCreateForm && (
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">New Project</h2>
          <form onSubmit={handleCreateProject}>
            {createProjectError && <div className="alert-error">{createProjectError}</div>}
            <InputField
              label="Project Name"
              id="newProjectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <InputField
              label="Description"
              id="newProjectDescription"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              type="textarea" // Could use a custom textarea component
            />
            <Button type="submit" disabled={createProjectLoading} className="mt-4">
              {createProjectLoading ? <Spinner size="sm" /> : 'Add Project'}
            </Button>
          </form>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      {projects.length === 0 ? (
        <p className="text-gray-600">No projects found. Start by creating one!</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <li key={project.id} className="card flex flex-col justify-between">
              <div>
                <Link to={`/projects/${project.id}`} className="text-xl font-semibold text-indigo-600 hover:underline">
                  {project.name}
                </Link>
                <p className="text-gray-600 text-sm mt-1">Created by: {project.createdBy?.username || 'N/A'}</p>
                <p className="text-gray-700 mt-2">{project.description || 'No description provided.'}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isAuthorizedToModify(project.createdBy?.id) && (
                <div className="mt-4 flex space-x-2">
                  <Button variant="danger" onClick={() => handleDeleteProject(project.id)}>
                    Delete
                  </Button>
                  {/* You might add an edit button that opens a modal or navigates to an edit page */}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectListPage;
```
**`frontend/src/pages/ProjectDetailsPage.js`**
```javascript