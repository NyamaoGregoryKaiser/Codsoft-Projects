import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskCard from '../components/TaskCard';
import Button from '../components/ui/Button';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { TaskStatus, TaskPriority } from '../utils/helpers'; // Assuming these enums are defined there

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // For assignee dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Task Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    id: null,
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    due_date: '',
    project_id: parseInt(projectId),
    assignee_id: '',
  });
  const [taskFormErrors, setTaskFormErrors] = useState({});

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectResponse = await api.get(`/projects/${projectId}`);
      setProject(projectResponse.data);

      const tasksResponse = await api.get(`/tasks`, { params: { project_id: projectId } });
      setTasks(tasksResponse.data);

      // Fetch all users for assignee dropdown
      const usersResponse = await api.get('/users', { params: { limit: 100 } });
      setUsers(usersResponse.data);

    } catch (err) {
      console.error("Failed to fetch project details:", err);
      setError(err.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleCreateTaskClick = () => {
    setIsEditingTask(false);
    setCurrentTask({
      id: null,
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      due_date: '',
      project_id: parseInt(projectId),
      assignee_id: '',
    });
    setTaskFormErrors({});
    setShowTaskModal(true);
  };

  const handleEditTaskClick = (task) => {
    setIsEditingTask(true);
    setCurrentTask({
      ...task,
      project_id: task.project_id,
      assignee_id: task.assignee_id || '', // Ensure it's a string for select
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '', // Format for input type="date"
    });
    setTaskFormErrors({});
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      await api.delete(`/tasks/${taskId}`);
      alert("Task deleted successfully!");
      fetchProjectDetails(); // Refresh project details and tasks
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleTaskModalClose = () => {
    setShowTaskModal(false);
    setCurrentTask({
      id: null,
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      due_date: '',
      project_id: parseInt(projectId),
      assignee_id: '',
    });
    setTaskFormErrors({});
  };

  const handleTaskInputChange = (e) => {
    const { id, value } = e.target;
    setCurrentTask((prev) => ({ ...prev, [id]: value }));
    setTaskFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validateTaskForm = () => {
    const errors = {};
    if (!currentTask.title) errors.title = "Title is required.";
    if (!currentTask.project_id) errors.project_id = "Project is required.";
    if (currentTask.due_date && new Date(currentTask.due_date) < new Date(new Date().setHours(0,0,0,0))) errors.due_date = "Due date cannot be in the past.";
    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTaskSubmit = async () => {
    if (!validateTaskForm()) return;

    try {
      const taskPayload = {
        ...currentTask,
        project_id: parseInt(currentTask.project_id),
        assignee_id: currentTask.assignee_id ? parseInt(currentTask.assignee_id) : null,
        due_date: currentTask.due_date ? new Date(currentTask.due_date).toISOString() : null,
      };

      if (isEditingTask) {
        await api.put(`/tasks/${currentTask.id}`, taskPayload);
        alert("Task updated successfully!");
      } else {
        await api.post('/tasks', taskPayload);
        alert("Task created successfully!");
      }
      handleTaskModalClose();
      fetchProjectDetails(); // Refresh data
    } catch (err) {
      console.error(`Failed to ${isEditingTask ? 'update' : 'create'} task:`, err);
      setError(err.response?.data?.message || `Failed to ${isEditingTask ? 'update' : 'create'} task.`);
    }
  };

  const taskStatusOptions = Object.values(TaskStatus).map(status => ({ value: status, label: status }));
  const taskPriorityOptions = Object.values(TaskPriority).map(priority => ({ value: priority, label: priority }));
  const assigneeOptions = users.map(u => ({ value: u.id.toString(), label: u.username }));
  assigneeOptions.unshift({ value: '', label: 'Unassigned' });

  if (loading) {
    return <LoadingSpinner className="h-48" />;
  }

  if (error) {
    return <div className="text-center text-red-600 text-lg my-8">{error}</div>;
  }

  if (!project) {
    return <div className="text-center text-gray-600 text-lg my-8">Project not found or you don't have access.</div>;
  }

  const isProjectOwner = user?.id === project.owner_id || user?.is_superuser;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mr-4">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Project Overview</h2>
        <p className="text-gray-700 mb-4">{project.description || 'No description provided.'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 text-sm">
          <p><strong>Owner:</strong> {project.owner?.username || 'N/A'}</p>
          <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
          <p><strong>Tasks:</strong> {tasks.length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        {isProjectOwner && (
          <Button onClick={handleCreateTaskClick}>
            <PlusIcon className="h-5 w-5 mr-2" /> Create New Task
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10">No tasks found for this project. Create one above!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTaskClick}
              onDelete={handleDeleteTask}
              currentUser={user}
            />
          ))}
        </div>
      )}

      {/* Task Creation/Edit Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={handleTaskModalClose}
        title={isEditingTask ? 'Edit Task' : 'Create New Task'}
        onSubmit={handleTaskSubmit}
        submitText={isEditingTask ? 'Update Task' : 'Create Task'}
      >
        <Input
          label="Title"
          id="title"
          value={currentTask.title}
          onChange={handleTaskInputChange}
          error={taskFormErrors.title}
          required
        />
        <Input
          label="Description"
          id="description"
          value={currentTask.description}
          onChange={handleTaskInputChange}
          error={taskFormErrors.description}
          type="textarea"
        />
        <Select
          label="Assignee"
          id="assignee_id"
          value={currentTask.assignee_id}
          onChange={handleTaskInputChange}
          options={assigneeOptions}
          error={taskFormErrors.assignee_id}
        />
        <Select
          label="Status"
          id="status"
          value={currentTask.status}
          onChange={handleTaskInputChange}
          options={taskStatusOptions}
          error={taskFormErrors.status}
          required
        />
        <Select
          label="Priority"
          id="priority"
          value={currentTask.priority}
          onChange={handleTaskInputChange}
          options={taskPriorityOptions}
          error={taskFormErrors.priority}
          required
        />
        <Input
          label="Due Date"
          id="due_date"
          type="date"
          value={currentTask.due_date}
          onChange={handleTaskInputChange}
          error={taskFormErrors.due_date}
        />
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;