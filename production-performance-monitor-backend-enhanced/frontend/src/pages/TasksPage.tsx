```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, getTasksByProjectId, createTask, updateTask, deleteTask, getAllUsers } from '../services/api';
import { Project, Task, User, TaskStatus, TaskPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const TasksPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Current logged-in user
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For assigning tasks
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TO_DO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');

  const fetchProjectAndTasks = async () => {
    if (!projectId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedProject = await getProjectById(projectId);
      setProject(fetchedProject);
      const fetchedTasks = await getTasksByProjectId(projectId);
      setTasks(fetchedTasks);
      const fetchedUsers = await getAllUsers();
      setAllUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project and tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId, user]);

  const handleOpenModal = (task?: Task) => {
    setCurrentTask(task || null);
    setTitle(task ? task.title : '');
    setDescription(task ? task.description || '' : '');
    setStatus(task ? task.status : TaskStatus.TO_DO);
    setPriority(task ? task.priority : TaskPriority.MEDIUM);
    setDueDate(task?.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '');
    setAssigneeId(task?.assignee?.id || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTask(null);
    setTitle('');
    setDescription('');
    setStatus(TaskStatus.TO_DO);
    setPriority(TaskPriority.MEDIUM);
    setDueDate('');
    setAssigneeId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Project ID is missing.');
      return;
    }

    try {
      const taskPayload = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? dayjs(dueDate).toISOString() : null,
        assignee: assigneeId ? { id: assigneeId } : null,
      };

      if (currentTask) {
        // Update task
        await updateTask(currentTask.id, taskPayload);
      } else {
        // Create task
        await createTask(projectId, taskPayload);
      }
      fetchProjectAndTasks();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        fetchProjectAndTasks();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete task.');
      }
    }
  };

  if (loading) return <div className="text-center p-4">Loading tasks...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!project) return <div className="text-red-500 text-center p-4">Project not found or accessible.</div>;

  // Determine if the current user is the project owner
  const isProjectOwner = user?.id === project.owner?.id;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          <button onClick={() => navigate('/projects')} className="text-gray-500 hover:text-gray-700 mr-2">
            <ArrowLeftIcon className="h-6 w-6 inline-block" />
          </button>
          Tasks for "{project.name}"
        </h1>
        {isProjectOwner && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Task</span>
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-6">{project.description || 'No project description.'}</p>

      {tasks.length === 0 ? (
        <p className="text-gray-600">No tasks found for this project. {isProjectOwner && 'Start by creating one!'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="w-full bg-gray-100 border-b">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Priority</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Assignee</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Due Date</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{task.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'TO_DO' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">{task.assignee?.username || 'Unassigned'}</td>
                  <td className="px-4 py-3">{task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : 'N/A'}</td>
                  <td className="px-4 py-3 flex space-x-2">
                    {(isProjectOwner || user?.id === task.assignee?.id) && (
                      <>
                        <button
                          onClick={() => handleOpenModal(task)}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100"
                          title="Edit Task"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {isProjectOwner && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                            title="Delete Task"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {currentTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                  Title:
                </label>
                <input
                  type="text"
                  id="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                  Description:
                </label>
                <textarea
                  id="description"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
                    Status:
                  </label>
                  <select
                    id="status"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  >
                    {Object.values(TaskStatus).map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">
                    Priority:
                  </label>
                  <select
                    id="priority"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  >
                    {Object.values(TaskPriority).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">
                    Due Date:
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="assignee" className="block text-gray-700 text-sm font-bold mb-2">
                    Assignee:
                  </label>
                  <select
                    id="assignee"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {currentTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
```