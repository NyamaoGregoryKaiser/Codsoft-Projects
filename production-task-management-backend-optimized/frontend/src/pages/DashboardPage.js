```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const DashboardPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/projects?limit=5'), // Fetch latest 5 projects
          api.get('/tasks?limit=5&sortBy=dueDate&sortOrder=asc'), // Fetch upcoming 5 tasks
        ]);
        setProjects(projectsRes.data.projects);
        setTasks(tasksRes.data.tasks);
      } catch (err) {
        setError('Failed to load dashboard data.');
        toast.error('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome, {user?.firstName || user?.email}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Latest Projects */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Latest Projects</h2>
            <Link to="/projects" className="text-indigo-600 hover:text-indigo-800 font-medium">View All</Link>
          </div>
          {projects.length > 0 ? (
            <ul className="space-y-4">
              {projects.map((project) => (
                <li key={project.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <Link to={`/projects/${project.id}`} className="block hover:bg-gray-50 -mx-3 p-3 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <p className="text-gray-600 text-sm">{project.description || 'No description'}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Owner: {project.owner?.firstName || project.owner?.email} | Tasks: {project._count?.tasks || 0}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No projects found. <Link to="/projects" className="text-indigo-600 hover:text-indigo-800">Create one!</Link></p>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-indigo-600 hover:text-indigo-800 font-medium">View All</Link>
          </div>
          {tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li key={task.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <Link to={`/tasks/${task.id}`} className="block hover:bg-gray-50 -mx-3 p-3 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                    <p className="text-gray-600 text-sm">{task.project.name} - {task.status}</p>
                    {task.dueDate && (
                      <p className="text-gray-500 text-xs mt-1">Due: {dayjs(task.dueDate).format('MMM DD, YYYY')}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No upcoming tasks. <Link to="/tasks" className="text-indigo-600 hover:text-indigo-800">Create one!</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```