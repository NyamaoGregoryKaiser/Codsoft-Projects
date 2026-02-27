```typescript
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Project, Task } from '../types';
import { projects as projectsApi } from '../api/projects';
import { tasks as tasksApi } from '../api/tasks';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch user's projects
          const fetchedProjects = await projectsApi.getProjects();
          setUserProjects(fetchedProjects);

          // Fetch all tasks and filter for assigned tasks
          // Note: A dedicated API endpoint for 'my tasks' would be more efficient
          const allTasks = await tasksApi.getTasks();
          const filteredAssignedTasks = allTasks.filter(task => task.assignee?.id === user.id);
          setAssignedTasks(filteredAssignedTasks);

        } catch (err) {
          console.error('Failed to fetch dashboard data:', err);
          setError('Failed to load dashboard data. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else if (!authLoading && !user) {
      // If not authenticated, stop loading without data
      setLoading(false);
    }
  }, [authLoading, user]);

  if (loading || authLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <p className="text-lg text-gray-700 mb-8">Welcome back, {user?.name}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4 flex justify-between items-center">
            My Projects
            <Link to="/projects" className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200">
              View All
            </Link>
          </h2>
          {userProjects.length > 0 ? (
            <ul className="list-disc list-inside space-y-2">
              {userProjects.slice(0, 5).map((project) => (
                <li key={project.id} className="text-gray-700">
                  <Link to={`/projects/${project.id}`} className="hover:text-indigo-600">
                    {project.title}
                  </Link>
                </li>
              ))}
              {userProjects.length > 5 && (
                <li className="text-gray-700">... and {userProjects.length - 5} more.</li>
              )}
            </ul>
          ) : (
            <p className="text-gray-600">No projects found. <Link to="/projects" className="text-indigo-600 hover:underline">Create one?</Link></p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-green-600 mb-4 flex justify-between items-center">
            Tasks Assigned to Me
            {/* Note: In a real app, a dedicated /my-tasks route might be better */}
            <Link to="/tasks" className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">
              View All
            </Link>
          </h2>
          {assignedTasks.length > 0 ? (
            <ul className="list-disc list-inside space-y-2">
              {assignedTasks.slice(0, 5).map((task) => (
                <li key={task.id} className="text-gray-700">
                  <Link to={`/projects/${task.project.id}/tasks/${task.id}`} className="hover:text-green-600">
                    {task.title} (Project: {task.project.title}) - Status: {task.status}
                  </Link>
                </li>
              ))}
              {assignedTasks.length > 5 && (
                <li className="text-gray-700">... and {assignedTasks.length - 5} more.</li>
              )}
            </ul>
          ) : (
            <p className="text-gray-600">No tasks currently assigned to you.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
```