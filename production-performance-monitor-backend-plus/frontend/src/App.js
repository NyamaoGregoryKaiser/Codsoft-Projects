```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api'; // Proxy to backend /api

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken && storedUsername) {
      setToken(storedToken);
      setUsername(storedUsername);
      setIsLoggedIn(true);
      fetchProjects(storedToken);
      fetchTasks(storedToken);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: username,
        password,
      });
      const { token, username: loggedInUsername } = response.data;
      setToken(token);
      setUsername(loggedInUsername);
      setIsLoggedIn(true);
      setMessage(`Logged in as ${loggedInUsername}`);
      localStorage.setItem('token', token);
      localStorage.setItem('username', loggedInUsername);
      fetchProjects(token);
      fetchTasks(token);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
      });
      const { token, username: registeredUsername } = response.data;
      setToken(token);
      setUsername(registeredUsername);
      setIsLoggedIn(true);
      setMessage(`Registered and logged in as ${registeredUsername}`);
      localStorage.setItem('token', token);
      localStorage.setItem('username', registeredUsername);
      fetchProjects(token);
      fetchTasks(token);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
      console.error('Registration error:', error);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setIsLoggedIn(false);
    setProjects([]);
    setTasks([]);
    setMessage('Logged out');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  const authenticatedAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchProjects = async (authToken) => {
    try {
      const response = await authenticatedAxios.get('/projects/my-projects', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProjectId(response.data[0].id);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to fetch projects');
      console.error('Fetch projects error:', error);
    }
  };

  const fetchTasks = async (authToken) => {
    try {
      // For simplicity, fetch all tasks for admin, or assigned tasks for regular users
      // This endpoint needs to be adjusted based on actual backend security/API design
      const response = await authenticatedAxios.get('/tasks', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setTasks(response.data.content); // Assuming paginated response
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to fetch tasks');
      console.error('Fetch tasks error:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      // In a real app, ownerId would come from authenticated user context
      // For this demo, let's assume 'admin' user is ownerId 1 for created projects initially,
      // or you'd fetch the current user's ID.
      // For now, let's hardcode an ownerId or derive from current user.
      const ownerId = 1; // Assuming 'admin' is user ID 1
      const response = await authenticatedAxios.post('/projects', {
        name: newProjectName,
        description: `Description for ${newProjectName}`,
        ownerId: ownerId,
        memberIds: [ownerId] // Add owner as a member by default
      });
      setMessage(`Project '${response.data.name}' created!`);
      setNewProjectName('');
      fetchProjects(token);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create project');
      console.error('Create project error:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setMessage('Please select a project first.');
      return;
    }
    try {
      const response = await authenticatedAxios.post('/tasks', {
        title: newTaskTitle,
        description: `Description for ${newTaskTitle}`,
        status: 'TODO',
        projectId: selectedProjectId,
        // assignedToId: null // Can assign later
      });
      setMessage(`Task '${response.data.title}' created!`);
      setNewTaskTitle('');
      fetchTasks(token);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create task');
      console.error('Create task error:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'TODO' ? 'IN_PROGRESS' : (currentStatus === 'IN_PROGRESS' ? 'DONE' : 'TODO');
    try {
      await authenticatedAxios.put(`/tasks/${taskId}`, {
        status: newStatus,
        // Other fields might be required, e.g., title, description, projectId
        // This is a simplified update to only change status.
        // In a real app, you'd fetch full task, update status, then send
        title: tasks.find(t => t.id === taskId).title, // placeholder
        description: tasks.find(t => t.id === taskId).description, // placeholder
        projectId: tasks.find(t => t.id === taskId).projectId, // placeholder
      });
      setMessage(`Task ${taskId} status updated to ${newStatus}`);
      fetchTasks(token);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update task status');
      console.error('Update task status error:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TaskSync Pro</h1>
        <p className="message">{message}</p>

        {isLoggedIn ? (
          <div>
            <h2>Welcome, {username}!</h2>
            <button onClick={handleLogout}>Logout</button>

            <section className="form-section">
              <h3>Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
                <button type="submit">Create Project</button>
              </form>
            </section>

            <section className="list-section">
              <h3>My Projects</h3>
              {projects.length === 0 ? (
                <p>No projects found. Create one!</p>
              ) : (
                <ul>
                  {projects.map((project) => (
                    <li key={project.id}>
                      {project.name} - Owner: {project.ownerUsername}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="form-section">
              <h3>Create New Task</h3>
              <form onSubmit={handleCreateTask}>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                <button type="submit">Create Task</button>
              </form>
            </section>

            <section className="list-section">
              <h3>All Tasks (Admin sees all, User sees assigned/project tasks)</h3>
              {tasks.length === 0 ? (
                <p>No tasks found.</p>
              ) : (
                <ul>
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <strong>{task.title}</strong> (Project: {task.projectName}) - Status: {task.status}
                      {task.assignedToUsername && ` - Assigned to: ${task.assignedToUsername}`}
                      <button onClick={() => handleUpdateTaskStatus(task.id, task.status)}>Toggle Status</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <div className="auth-forms">
            <section className="form-section">
              <h3>Login</h3>
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Login</button>
              </form>
            </section>

            <section className="form-section">
              <h3>Register</h3>
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Register</button>
              </form>
            </section>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
```