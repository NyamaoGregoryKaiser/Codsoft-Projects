```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as projectApi from '../api/projects';
import * as taskApi from '../api/tasks';
import ProjectCard from '../components/ProjectCard';
import TaskCard from '../components/TaskCard';
import './Dashboard.css';

function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const projectsResponse = await projectApi.getProjects();
        setProjects(projectsResponse.data);

        // Fetch tasks assigned to the current user (simplified: fetch all and filter client-side)
        const allTasksResponse = await taskApi.getTasks(''); // Empty string fetches all for this simple API
        const userTasks = allTasksResponse.data.filter(task => task.assignee?.id === user.id && task.status !== 'done');
        setTasks(userTasks);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) return <div className="loading-message">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-page">
      <h1>Welcome, {user.name}!</h1>

      <section className="dashboard-section">
        <h2>Your Projects</h2>
        {projects.length > 0 ? (
          <div className="project-list">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p>You are not involved in any projects yet.</p>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Your Pending Tasks</h2>
        {tasks.length > 0 ? (
          <div className="task-list">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} projectId={task.projectId} />
            ))}
          </div>
        ) : (
          <p>You have no pending tasks.</p>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
```