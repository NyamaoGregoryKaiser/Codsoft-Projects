```typescript
import React, { useState, useEffect } from 'react';
import { getMyProjects } from '../services/api';
import { Project, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { getMyTasks } from '../services/api';
import dayjs from 'dayjs';
import { FolderIcon, TaskIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon, ListBulletIcon } from '@heroicons/react/24/outline';


const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const fetchedProjects = await getMyProjects();
        setProjects(fetchedProjects);

        const fetchedTasks = await getMyTasks();
        setTasks(fetchedTasks);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status !== 'DONE').length;
  const completedTasks = tasks.filter(task => task.status === 'DONE').length;
  const overdueTasks = tasks.filter(task => task.dueDate && dayjs(task.dueDate).isBefore(dayjs()) && task.status !== 'DONE').length;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, {user?.username}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-indigo-50 p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-indigo-700">Total Projects</h2>
            <p className="text-3xl font-bold text-indigo-900">{totalProjects}</p>
          </div>
          <FolderIcon className="h-10 w-10 text-indigo-400" />
        </div>

        <div className="bg-blue-50 p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-blue-700">Total Tasks</h2>
            <p className="text-3xl font-bold text-blue-900">{totalTasks}</p>
          </div>
          <ListBulletIcon className="h-10 w-10 text-blue-400" />
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-yellow-700">Pending Tasks</h2>
            <p className="text-3xl font-bold text-yellow-900">{pendingTasks}</p>
          </div>
          <ClockIcon className="h-10 w-10 text-yellow-400" />
        </div>

        <div className="bg-green-50 p-6 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-green-700">Completed Tasks</h2>
            <p className="text-3xl font-bold text-green-900">{completedTasks}</p>
          </div>
          <CheckCircleIcon className="h-10 w-10 text-green-400" />
        </div>
      </div>

      {overdueTasks > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
          <p className="font-bold flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            <span>You have {overdueTasks} overdue tasks!</span>
          </p>
          <p>Please review your tasks and update their statuses.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Projects</h2>
          {projects.length === 0 ? (
            <p className="text-gray-600">You don't have any projects yet.</p>
          ) : (
            <ul className="space-y-3">
              {projects.slice(0, 5).map(project => (
                <li key={project.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg text-indigo-800">{project.name}</h3>
                  <p className="text-gray-600 text-sm">{project.description}</p>
                </li>
              ))}
              {projects.length > 5 && (
                <li className="text-center text-indigo-600 hover:underline">
                  <a href="/projects">View all {totalProjects} projects</a>
                </li>
              )}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Assigned Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-600">You are not assigned to any tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <li key={task.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg text-blue-800">{task.title}</h3>
                  <p className="text-gray-600 text-sm">Project: {task.project?.name || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">Status: <span className={`font-semibold ${task.status === 'DONE' ? 'text-green-600' : task.status === 'IN_PROGRESS' ? 'text-yellow-600' : 'text-gray-600'}`}>{task.status}</span></p>
                  {task.dueDate && <p className="text-gray-600 text-sm">Due: {dayjs(task.dueDate).format('YYYY-MM-DD')}</p>}
                </li>
              ))}
              {tasks.length > 5 && (
                <li className="text-center text-blue-600 hover:underline">
                  <a href="/tasks">View all {totalTasks} tasks</a>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```