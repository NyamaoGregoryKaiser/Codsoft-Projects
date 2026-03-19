import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';
import { Task, CreateTaskInput, UpdateTaskInput, ErrorResponse } from '../types';
import axios from 'axios';
import TaskForm from '../components/TaskForm';
import TaskItem from '../components/TaskItem';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Task[]>('/tasks');
      setTasks(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.message || 'Failed to fetch tasks.');
      } else {
        setError('An unexpected error occurred while fetching tasks.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (data: CreateTaskInput) => {
    setError(null);
    try {
      const response = await api.post<Task>('/tasks', data);
      setTasks((prevTasks) => [...prevTasks, response.data]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.message || 'Failed to create task.');
      } else {
        setError('An unexpected error occurred while creating task.');
      }
    }
  };

  const handleUpdateTask = async (id: string, data: UpdateTaskInput) => {
    setError(null);
    try {
      const response = await api.patch<Task>(`/tasks/${id}`, data);
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? response.data : task)));
      setEditingTask(null); // Exit editing mode
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.message || 'Failed to update task.');
      } else {
        setError('An unexpected error occurred while updating task.');
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    setError(null);
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data as ErrorResponse;
        setError(errorData.message || 'Failed to delete task.');
      } else {
        setError('An unexpected error occurred while deleting task.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Welcome, {user?.name} ({user?.role})!
        </h2>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Logout
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        {editingTask ? 'Edit Task' : 'Create New Task'}
      </h3>
      <TaskForm
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask || undefined}
        isEditing={!!editingTask}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Your Tasks</h3>
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found. Create one above!</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onUpdateStatus={handleUpdateTask}
              isUserAdmin={user?.role === 'ADMIN'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;