```javascript
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { UserIcon, PlusIcon, PencilIcon, TrashIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import TaskForm from '../components/forms/TaskForm';
import { useAuth } from '../context/AuthContext';
import ProjectForm from '../components/forms/ProjectForm'; // For editing project

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // For editing task

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      setError('Failed to load project details.');
      toast.error('Failed to load project details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleCreateTask = () => {
    setCurrentTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully!');
        fetchProject(); // Refresh project details to update task list
      } catch (err) {
        toast.error('Failed to delete task.');
        console.error(err);
      }
    }
  };

  const handleTaskFormSubmit = () => {
    setIsTaskModalOpen(false);
    fetchProject(); // Refresh project data to show new/updated task
  };

  const handleProjectFormSubmit = () => {
    setIsProjectEditModalOpen(false);
    fetchProject(); // Refresh project data after editing
  };

  if (loading) return <div className="p-6 text-center">Loading project...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!project) return <div className="p-6 text-center">Project not found.</div>;

  const isProjectOwner = project.ownerId === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
        {isProjectOwner && (
          <button
            onClick={() => setIsProjectEditModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Project
          </button>
        )}
      </div>

      <p className="text-gray-700 text-lg mb-4">{project.description || 'No description provided.'}</p>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Details</h2>
          <p className="text-gray-700"><span className="font-medium">Owner:</span> {project.owner.firstName} {project.owner.lastName} ({project.owner.email})</p>
          <p className="text-gray-700"><span className="font-medium">Members:</span> {project.members.length}</p>
          <p className="text-gray-700"><span className="font-medium">Created:</span> {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Members</h2>
          <ul className="list-disc list-inside text-gray-700">
            {project.members.map(member => (
              <li key={member.id} className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1 inline-block" />
                {member.firstName} {member.lastName} ({member.email})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        <button
          onClick={handleCreateTask}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Task
        </button>
      </div>

      {project.tasks.length === 0 ? (
        <p className="text-gray-600 text-lg">No tasks for this project yet. Create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
              <Link to={`/tasks/${task.id}`} className="block">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description || 'No description'}</p>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-500">Status: <span className="font-medium text-blue-600">{task.status}</span></span>
                  <span className="text-gray-500">Priority: <span className="font-medium text-red-600">{task.priority}</span></span>
                </div>
                <div className="flex items-center text-gray-500 text-xs">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span>Assignee: {task.assignee?.firstName || task.assignee?.email || 'Unassigned'}</span>
                </div>
              </Link>
              {(isProjectOwner || task.creatorId === user.id) && ( // Allow creator or project owner to edit/delete tasks
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                    title="Edit Task"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Task"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={currentTask ? 'Edit Task' : 'Create New Task'}>
        <TaskForm
          projectMembers={project.members} // Pass project members for assignee selection
          projectId={projectId}
          task={currentTask}
          onSuccess={handleTaskFormSubmit}
          onCancel={() => setIsTaskModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isProjectEditModalOpen} onClose={() => setIsProjectEditModalOpen(false)} title="Edit Project">
        <ProjectForm
          project={project}
          onSuccess={handleProjectFormSubmit}
          onCancel={() => setIsProjectEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
```