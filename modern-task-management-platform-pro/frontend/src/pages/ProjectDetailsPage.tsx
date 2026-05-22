```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from 'hooks/useProjects';
import { useTasks } from 'hooks/useTasks';
import TaskCard from 'components/TaskCard';
import Modal from 'components/Modal';
import Pagination from 'components/Pagination';
import { Project, Task, TaskPriority, TaskStatus, User } from 'types';
import * as projectApi from 'api/projects';
import * as userApi from 'api/users'; // Assuming you have a user API to fetch potential assignees
import './ProjectDetailsPage.css';

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const { tasks, loading: tasksLoading, error: tasksError, fetchTasks, createTask, updateTask, deleteTask, pagination } = useTasks();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null); // For edit
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | undefined>('');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    setProjectLoading(true);
    setProjectError(null);
    try {
      const res = await projectApi.getProjectById(projectId);
      if (res.success && res.data) {
        setProject(res.data);
      } else {
        setProjectError(res.message || 'Failed to fetch project details.');
      }
    } catch (err: any) {
      setProjectError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setProjectLoading(false);
    }
  }, [projectId]);

  const fetchAssignableUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      // In a real app, you might fetch users associated with this project or team members
      // For simplicity, fetching all users that are not admins
      const res = await userApi.getUsers();
      if (res.success && res.data) {
        // Filter out admin or specific roles if needed
        setAssignableUsers(res.data.data.filter(u => u.role !== 'admin')); 
      }
    } catch (err) {
      console.error('Failed to fetch assignable users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectDetails();
    fetchAssignableUsers();
  }, [fetchProjectDetails, fetchAssignableUsers]);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  const handleCreateNewTask = () => {
    setCurrentTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskStatus('todo');
    setTaskPriority('medium');
    setTaskDueDate('');
    setTaskAssigneeId(''); // No assignee by default
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setTaskAssigneeId(task.assignee?.id || '');
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError(null);
    if (!taskTitle.trim()) {
      setTaskFormError('Task title cannot be empty.');
      return;
    }
    if (!projectId) {
      setTaskFormError('Project ID is missing.');
      return;
    }

    const payload = {
      title: taskTitle,
      description: taskDescription || undefined,
      status: taskStatus,
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      assigneeId: taskAssigneeId || undefined,
    };

    try {
      if (currentTask) {
        // Update existing task
        await updateTask(currentTask.id, payload);
      } else {
        // Create new task
        await createTask(projectId, payload);
      }
      setIsTaskModalOpen(false);
      fetchTasks(projectId); // Re-fetch tasks to update the list
    } catch (err: any) {
      setTaskFormError(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        fetchTasks(projectId); // Re-fetch tasks to update the list
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete task.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (projectId) {
      fetchTasks(projectId, page, pagination.limit);
    }
  };

  if (projectLoading || usersLoading) return <div className="loading-state">Loading project details...</div>;
  if (projectError) return <div className="error-state">Error: {projectError}</div>;
  if (!project) return <div className="error-state">Project not found.</div>;

  return (
    <div className="project-details-page-container">
      <header className="project-details-header">
        <h1>{project.name}</h1>
        <p>{project.description}</p>
        <p>Owner: {project.owner.firstName} {project.owner.lastName}</p>
        <button onClick={handleCreateNewTask} className="btn primary-btn">
          Create New Task
        </button>
      </header>

      <section className="tasks-list">
        <h2>Tasks</h2>
        {tasksLoading && tasks.length === 0 ? (
          <div className="loading-state">Loading tasks...</div>
        ) : tasksError ? (
          <div className="error-state">Error loading tasks: {tasksError}</div>
        ) : tasks.length === 0 ? (
          <p className="no-content-message">No tasks found for this project. Create the first one!</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
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

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={currentTask ? 'Edit Task' : 'Create New Task'}>
        <form onSubmit={handleSaveTask} className="task-form">
          {taskFormError && <p className="error-message">{taskFormError}</p>}
          <div className="form-group">
            <label htmlFor="taskTitle">Task Title:</label>
            <input
              type="text"
              id="taskTitle"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              aria-label="Task Title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskDescription">Description:</label>
            <textarea
              id="taskDescription"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              aria-label="Task Description"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="taskStatus">Status:</label>
            <select
              id="taskStatus"
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
              aria-label="Task Status"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="taskPriority">Priority:</label>
            <select
              id="taskPriority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              aria-label="Task Priority"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="taskDueDate">Due Date:</label>
            <input
              type="date"
              id="taskDueDate"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              aria-label="Task Due Date"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskAssignee">Assignee:</label>
            <select
              id="taskAssignee"
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value || undefined)}
              aria-label="Task Assignee"
              disabled={usersLoading}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn primary-btn">
            {currentTask ? 'Update Task' : 'Create Task'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailsPage;
```