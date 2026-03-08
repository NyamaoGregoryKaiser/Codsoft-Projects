```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '../api';
import useAuth from '../hooks/useAuth';

const ProjectForm = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projectId } = useParams(); // Will be undefined for new projects
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (projectId) {
      setIsEditing(true);
      const fetchProject = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await projectApi.getProject(projectId);
          setName(response.data.name);
          setDescription(response.data.description || '');
        } catch (err) {
          console.error('Failed to fetch project:', err);
          setError('Failed to load project details.');
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    } else {
      setIsEditing(false);
      setLoading(false);
    }
  }, [isAuthenticated, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEditing) {
        await projectApi.updateProject(projectId, { name, description });
      } else {
        await projectApi.createProject({ name, description });
      }
      navigate('/projects'); // Redirect to projects list
    } catch (err) {
      console.error('Failed to save project:', err);
      setError(err.response?.data?.message || 'Failed to save project.');
    }
  };

  if (authLoading || loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isEditing ? 'Edit Project' : 'Create New Project'}
      </h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Project Name:
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Description (Optional):
          </label>
          <textarea
            id="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            {isEditing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
```