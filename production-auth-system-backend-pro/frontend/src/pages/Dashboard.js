```javascript
import React, { useState, useEffect } from 'react';
import TaskList from '../components/task/TaskList';
import TaskForm from '../components/task/TaskForm';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/task.service';
import { PlusIcon } from '@heroicons/react/24/solid';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks: ' + (err || 'Unknown error'));
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateOrUpdateTask = async (taskData) => {
    setError('');
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, taskData);
        console.log("Task updated:", taskData);
      } else {
        await taskService.createTask(taskData);
        console.log("Task created:", taskData);
      }
      setShowTaskForm(false);
      setEditingTask(null);
      fetchTasks(); // Refresh tasks after C/U
    } catch (err) {
      setError('Failed to save task: ' + (err || 'Unknown error'));
      console.error('Failed to save task:', err);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    setError('');
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        fetchTasks(); // Refresh tasks after deletion
      } catch (err) {
        setError('Failed to delete task: ' + (err || 'Unknown error'));
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleToggleComplete = async (task) => {
    setError('');
    try {
      await taskService.updateTask(task.id, { ...task, completed: !task.completed });
      fetchTasks();
    } catch (err) {
      setError('Failed to update task status: ' + (err || 'Unknown error'));
      console.error('Failed to update task status:', err);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Welcome, {currentUser?.email}!
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        Manage your tasks efficiently. You are logged in as a <span className="font-semibold text-blue-600">{currentUser?.role}</span>.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">Your Tasks</h2>
        <button
          onClick={() => {
            setEditingTask(null);
            setShowTaskForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" /> New Task
        </button>
      </div>

      {showTaskForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-inner">
          <TaskForm
            task={editingTask}
            onSubmit={handleCreateOrUpdateTask}
            onCancel={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
          />
        </div>
      )}

      <TaskList tasks={tasks} onEdit={handleEditTask} onDelete={handleDeleteTask} onToggleComplete={handleToggleComplete} />
    </div>
  );
};

export default Dashboard;
```