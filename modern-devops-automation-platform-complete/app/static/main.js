let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');
let currentUser = JSON.parse(localStorage.getItem('current_user'));

const API_BASE = '/api/v1';

function updateUI() {
    if (accessToken && currentUser) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('api-section').style.display = 'block';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('current-username').textContent = currentUser.username;
        document.getElementById('is-admin').textContent = currentUser.is_admin ? 'Yes' : 'No';
        document.getElementById('access-token-display').textContent = accessToken.substring(0, 30) + '...';
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('api-section').style.display = 'none';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('access-token-display').textContent = 'N/A';
    }
}

async function apiCall(method, url, data = null, auth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (auth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config = {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null
    };

    let response = await fetch(url, config);

    // Handle token expiration / refresh
    if (response.status === 401 && auth && !url.includes('/auth/refresh')) {
        console.log('Access token expired or invalid, attempting refresh...');
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
            // Retry original call with new token
            headers['Authorization'] = `Bearer ${accessToken}`;
            config.headers = headers;
            response = await fetch(url, config);
        } else {
            alert('Session expired. Please log in again.');
            logout();
            return null;
        }
    }

    const responseData = await response.json();
    document.getElementById('api-response').textContent = JSON.stringify(responseData, null, 2);

    if (!response.ok) {
        console.error('API Error:', responseData);
        alert(`Error: ${responseData.message || JSON.stringify(responseData)}`);
        return null;
    }
    return responseData;
}

async function refreshAccessToken() {
    if (!refreshToken) return false;
    console.log('Refreshing token...');
    try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            accessToken = data.access_token;
            localStorage.setItem('access_token', accessToken);
            console.log('Token refreshed successfully.');
            updateUI();
            return true;
        } else {
            console.error('Failed to refresh token:', data);
            return false;
        }
    } catch (error) {
        console.error('Network error during token refresh:', error);
        return false;
    }
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const data = await apiCall('POST', `${API_BASE}/auth/register`, { username, email, password }, false);
    if (data) {
        alert('Registration successful! You can now log in.');
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = password;
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const data = await apiCall('POST', `${API_BASE}/auth/login`, { username, password }, false);
    if (data) {
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        currentUser = data.user;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('current_user', JSON.stringify(currentUser));
        alert('Login successful!');
        updateUI();
    }
}

async function logout() {
    const data = await apiCall('POST', `${API_BASE}/auth/logout`);
    if (data) {
        accessToken = null;
        refreshToken = null;
        currentUser = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        alert('Logged out successfully!');
        updateUI();
    }
}

async function createProject() {
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-description').value;
    const data = await apiCall('POST', `${API_BASE}/projects/`, { name, description });
    if (data) {
        alert(`Project "${data.name}" created!`);
        document.getElementById('project-name').value = '';
        document.getElementById('project-description').value = '';
        getAllProjects(); // Refresh project list
    }
}

async function getAllProjects() {
    const data = await apiCall('GET', `${API_BASE}/projects/`);
    const projectListDiv = document.getElementById('projects-list');
    projectListDiv.innerHTML = '';
    if (data && data.projects.length > 0) {
        data.projects.forEach(p => {
            const div = document.createElement('div');
            div.className = 'project-item';
            div.innerHTML = `
                <strong>ID:</strong> ${p.id}<br>
                <strong>Name:</strong> ${p.name}<br>
                <strong>Description:</strong> ${p.description || 'N/A'}<br>
                <strong>Owner:</strong> ${p.owner_username} (ID: ${p.owner_id})<br>
                <strong>Completed:</strong> ${p.is_completed ? 'Yes' : 'No'}
            `;
            projectListDiv.appendChild(div);
        });
    } else if (data) {
        projectListDiv.textContent = 'No projects found.';
    }
}

async function createTask() {
    const projectId = document.getElementById('task-project-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const assigneeId = document.getElementById('task-assignee-id').value;
    const status = document.getElementById('task-status').value;
    const priority = document.getElementById('task-priority').value;
    let dueDate = document.getElementById('task-due-date').value;

    if (dueDate) {
        // Convert local datetime string to ISO 8601 UTC string
        const localDate = new Date(dueDate);
        dueDate = localDate.toISOString(); // e.g., "2023-12-31T23:59:00.000Z"
    } else {
        dueDate = null;
    }

    const data = await apiCall('POST', `${API_BASE}/tasks/project/${projectId}`, {
        title,
        description,
        assignee_id: assigneeId ? parseInt(assigneeId) : null,
        status,
        priority,
        due_date: dueDate
    });
    if (data) {
        alert(`Task "${data.title}" created!`);
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-assignee-id').value = '';
        document.getElementById('task-status').value = 'todo';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-due-date').value = '';
        getProjectTasks(); // Refresh tasks for the current project ID
    }
}

async function getProjectTasks() {
    const projectId = document.getElementById('get-tasks-project-id').value;
    if (!projectId) {
        alert('Please enter a Project ID to get tasks.');
        return;
    }
    const data = await apiCall('GET', `${API_BASE}/tasks/project/${projectId}`);
    const taskListDiv = document.getElementById('tasks-list');
    taskListDiv.innerHTML = '';
    if (data && data.tasks.length > 0) {
        data.tasks.forEach(t => {
            const div = document.createElement('div');
            div.className = 'task-item';
            div.innerHTML = `
                <strong>ID:</strong> ${t.id}<br>
                <strong>Title:</strong> ${t.title}<br>
                <strong>Status:</strong> ${t.status}<br>
                <strong>Priority:</strong> ${t.priority}<br>
                <strong>Assignee:</strong> ${t.assignee_username || 'Unassigned'} (ID: ${t.assignee_id || 'N/A'})<br>
                <strong>Due Date:</strong> ${t.due_date ? new Date(t.due_date).toLocaleString() : 'N/A'}
            `;
            taskListDiv.appendChild(div);
        });
    } else if (data) {
        taskListDiv.textContent = 'No tasks found for this project.';
    }
}


// Initial UI setup
updateUI();
```