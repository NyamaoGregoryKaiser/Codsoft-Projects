import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskCard from '../components/TaskCard';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useNavigate } from 'react-router-dom';
import { TaskStatus, TaskPriority } from '../utils/helpers'; // Assuming these enums are defined there

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // To populate assignee dropdown

  // Modals for Create Task/Project
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    due_date: '',
    project_id: '',
    assignee_id: '',
  });
  const [taskFormErrors, setTaskFormErrors] = useState({});

  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });
  const [projectFormErrors, setProjectFormErrors] = useState({});


  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch user's tasks (assigned and/or created)
      const tasksResponse = await api.get('/tasks', {
        params: { limit: 5 } // Fetch a few recent tasks
      });
      setTasks(tasksResponse.data);

      // Fetch user's projects
      const projectsResponse = await api.get('/projects', {
        params: { limit: 3 } // Fetch a few recent projects
      });
      setProjects(projectsResponse.data);

      // Fetch all users for assignee dropdown (only if superuser, otherwise limited view)
      if (user?.is_superuser) { // Or if user can only see users in their projects etc.
        const usersResponse = await api.get('/users', { params: { limit: 100 }}); // Adjust limit as needed
        setUsers(usersResponse.data);
      } else {
        // For regular users, you might only fetch project members or not show assignee dropdown initially.
        // For simplicity, we'll only fetch if superuser here.
        setUsers([user]); // Only current user as an option
      }

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateTaskChange = (e) => {
    const { id, value } = e.target;
    setNewTask((prev) => ({ ...prev, [id]: value }));
    setTaskFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validateTaskForm = () => {
    const errors = {};
    if (!newTask.title) errors.title = "Title is required.";
    if (!newTask.project_id) errors.project_id = "Project is required.";
    if (newTask.due_date && new Date(newTask.due_date) < new Date()) errors.due_date = "Due date cannot be in the past.";
    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTaskSubmit = async () => {
    if (!validateTaskForm()) return;

    try {
      await api.post('/tasks', {
        ...newTask,
        project_id: parseInt(newTask.project_id),
        assignee_id: newTask.assignee_id ? parseInt(newTask.assignee_id) : null,
      });
      setShowCreateTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        due_date: '',
        project_id: '',
        assignee_id: '',
      });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error("Failed to create task:", err);
      setError(err.response?.data?.message || "Failed to create task.");
    }
  };

  const handleCreateProjectChange = (e) => {
    const { id, value } = e.target;
    setNewProject((prev) => ({ ...prev, [id]: value }));
    setProjectFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validateProjectForm = () => {
    const errors = {};
    if (!newProject.name) errors.name = "Project name is required.";
    setProjectFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProjectSubmit = async () => {
    if (!validateProjectForm()) return;

    try {
      await api.post('/projects', newProject);
      setShowCreateProjectModal(false);
      setNewProject({ name: '', description: '' });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };

  const taskStatusOptions = Object.values(TaskStatus).map(status => ({ value: status, label: status }));
  const taskPriorityOptions = Object.values(TaskPriority).map(priority => ({ value: priority, label: priority }));
  const projectOptions = projects.map(proj => ({ value: proj.id.toString(), label: proj.name }));
  const assigneeOptions = users.map(u => ({ value: u.id.toString(), label: u.username }));
  assigneeOptions.unshift({ value: '', label: 'Unassigned' });


  if (loading) {
    return <LoadingSpinner className="h-48" />;
  }

  if (error) {
    return <div className="text-center text-red-600 text-lg my-8">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Quick Actions */}
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Actions</h2>
        <div className="space-y-4">
          <Button className="w-full justify-center" onClick={() => setShowCreateTaskModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" /> Create New Task
          </Button>
          <Button variant="secondary" className="w-full justify-center" onClick={() => setShowCreateProjectModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" /> Create New Project
          </Button>
          <Button variant="outline" className="w-full justify-center" onClick={() => navigate('/projects')}>
            View All Projects
          </Button>
          <Button variant="outline" className="w-full justify-center" onClick={() => navigate('/tasks')}>
            View All Tasks {/* This route doesn't exist yet but conceptually can */}
          </Button>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">My Recent Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-600">No recent tasks found. Start by creating one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} currentUser={user} onEdit={() => navigate(`/tasks/${task.id}`)} onDelete={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* My Projects */}
      <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">My Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-600">No projects found. Create your first project!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} currentUser={user} onEdit={() => navigate(`/projects/${project.id}`)} onDelete={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        title="Create New Task"
        onSubmit={handleCreateTaskSubmit}
        submitText="Create Task"
      >
        <Input
          label="Title"
          id="title"
          value={newTask.title}
          onChange={handleCreateTaskChange}
          error={taskFormErrors.title}
          required
        />
        <Input
          label="Description"
          id="description"
          value={newTask.description}
          onChange={handleCreateTaskChange}
          error={taskFormErrors.description}
          type="textarea" // Not a real type, would need custom component
        />
        <Select
          label="Project"
          id="project_id"
          value={newTask.project_id}
          onChange={handleCreateTaskChange}
          options={[{ value: '', label: 'Select Project' }, ...projectOptions]}
          error={taskFormErrors.project_id}
          required
        />
        <Select
          label="Assignee"
          id="assignee_id"
          value={newTask.assignee_id}
          onChange={handleCreateTaskChange}
          options={assigneeOptions}
          error={taskFormErrors.assignee_id}
        />
        <Select
          label="Status"
          id="status"
          value={newTask.status}
          onChange={handleCreateTaskChange}
          options={taskStatusOptions}
          error={taskFormErrors.status}
        />
        <Select
          label="Priority"
          id="priority"
          value={newTask.priority}
          onChange={handleCreateTaskChange}
          options={taskPriorityOptions}
          error={taskFormErrors.priority}
        />
        <Input
          label="Due Date"
          id="due_date"
          type="date"
          value={newTask.due_date ? newTask.due_date.split('T')[0] : ''} // Format for date input
          onChange={handleCreateTaskChange}
          error={taskFormErrors.due_date}
        />
      </Modal>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        title="Create New Project"
        onSubmit={handleCreateProjectSubmit}
        submitText="Create Project"
      >
        <Input
          label="Project Name"
          id="name"
          value={newProject.name}
          onChange={handleCreateProjectChange}
          error={projectFormErrors.name}
          required
        />
        <Input
          label="Description"
          id="description"
          value={newProject.description}
          onChange={handleCreateProjectChange}
          error={projectFormErrors.description}
          type="textarea"
        />
      </Modal>
    </div>
  );
};

export default Dashboard;