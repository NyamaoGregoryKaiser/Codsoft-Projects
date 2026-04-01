import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Task, User } from '../types';
import { projectApi, userApi } from '../services/api';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectAndUsers = async () => {
    try {
      setLoading(true);
      const projectResponse = await projectApi.getProjectById(id!);
      setProject(projectResponse.data);

      const usersResponse = await userApi.getAllUsers(); // Assuming this is allowed for any authenticated user to fetch for task assignment
      setUsers(usersResponse.data);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndUsers();
  }, [id]);

  if (loading) {
    return <div className="text-center p-8">Loading project details...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!project) {
    return <div className="text-center p-8">Project not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <p className="text-gray-700 mb-4">{project.description}</p>
          <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
            <p><strong>Owner:</strong> {project.owner.firstName} {project.owner.lastName}</p>
            <p><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {new Date(project.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Task List Component */}
        {project.tasks && (
          <TaskList
            tasks={project.tasks}
            projectId={project.id}
            onTaskUpdated={fetchProjectAndUsers} // Pass callback to refresh data
            users={users}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;