import React, { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskPriority } from '../types/task';
import { User, UserRole } from '../types/auth'; // Ensure User is imported
import * as taskService from '../api/taskService';
import * as userService from '../api/userService'; // Assuming a userService
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user: currentUser } = useAuth(); // Renamed to avoid conflict
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]); // State to hold all users
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: any = {
        page: 1, // Simple pagination, could be more complex
        limit: 100,
      };
      if (filterStatus !== 'ALL') queryParams.status = filterStatus;
      if (filterPriority !== 'ALL') queryParams.priority = filterPriority;
      if (searchQuery) queryParams.search = searchQuery;

      const response = await taskService.getTasks(queryParams);
      setTasks(response.tasks);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, searchQuery]);

  const fetchUsers = useCallback(async () => {
    if (currentUser?.role === UserRole.ADMIN) {
      try {
        const response = await userService.getUsers(); // Implement this in api/userService.ts
        setUsers(response.users);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleCreateTask = async (taskData: CreateTaskDto) => {
    setLoading(true);
    setError(null);
    try {
      await taskService.createTask(taskData);
      setShowForm(false);
      setEditingTask(undefined);
      fetchTasks(); // Refresh tasks
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: UpdateTaskDto) => {
    if (!editingTask) return;
    setLoading(true);
    setError(null);
    try {
      await taskService.updateTask(editingTask.id, taskData);
      setShowForm(false);
      setEditingTask(undefined);
      fetchTasks(); // Refresh tasks
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      setError(null);
      try {
        await taskService.deleteTask(id);
        fetchTasks(); // Refresh tasks
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to delete task');
      } finally {
        setLoading(false);
      }
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingTask(undefined);
    setShowForm(false);
  };

  if (!currentUser) return <p>Loading user data...</p>;
  if (loading && tasks.length === 0) return <p>Loading tasks...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="dashboard-page">
      <h2>Your Tasks</h2>

      <div className="task-controls">
        <div className="filters">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}>
                <option value="ALL">All Statuses</option>
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'ALL')}>
                <option value="ALL">All Priorities</option>
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-primary" onClick={fetchTasks}>Apply Filters</button>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTask(undefined); setShowForm(true); }}>
          Add New Task
        </button>
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={cancelForm}
          isLoading={loading}
          users={users}
        />
      )}

      <TaskList
        tasks={tasks}
        onEdit={startEdit}
        onDelete={handleDeleteTask}
        currentUserRole={currentUser.role}
        currentUserId={currentUser.id}
      />
    </div>
  );
};

export default Dashboard;