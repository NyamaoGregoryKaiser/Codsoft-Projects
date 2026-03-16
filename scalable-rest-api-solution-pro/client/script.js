```javascript
const API_BASE_URL = 'http://localhost:9080/api'; // Ensure this matches your API server port
let authToken = localStorage.getItem('authToken') || '';
let currentUserId = localStorage.getItem('currentUserId') || '';

const apiResponseDiv = document.getElementById('apiResponse');
const currentTokenSpan = document.getElementById('currentToken');

function updateAuthInfo() {
    currentTokenSpan.textContent = authToken ? authToken.substring(0, 30) + '...' : 'Not logged in';
}

function displayMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${isError ? 'error' : 'success'}`;
}

function clearMessage(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.className = 'message';
}

async function apiCall(method, path, body = null, messageElementId = 'apiResponse') {
    apiResponseDiv.textContent = 'Loading...';
    clearMessage(messageElementId);

    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    };

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, options);
        const data = await response.json().catch(() => ({ message: response.statusText }));

        if (!response.ok) {
            displayMessage(messageElementId, `Error (${response.status}): ${data.message || JSON.stringify(data)}`, true);
            apiResponseDiv.textContent = JSON.stringify(data, null, 2);
            return null;
        }

        displayMessage(messageElementId, `Success (${response.status})`, false);
        apiResponseDiv.textContent = JSON.stringify(data, null, 2);
        return data;
    } catch (error) {
        displayMessage(messageElementId, `Network error: ${error.message}`, true);
        apiResponseDiv.textContent = `Network error: ${error.message}`;
        return null;
    }
}

// --- Authentication Functions ---
async function registerUser() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const body = { username, email, password };
    const data = await apiCall('POST', '/auth/register', body, 'authMessage');
    if (data && data.id) {
        currentUserId = data.id;
        localStorage.setItem('currentUserId', currentUserId);
        displayMessage('authMessage', `User ${username} registered with ID: ${data.id}`, false);
    }
}

async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const body = { email, password };
    const data = await apiCall('POST', '/auth/login', body, 'authMessage');
    if (data && data.token) {
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        // Extract user ID from token (very basic, usually done on backend or more robustly client-side)
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        currentUserId = payload.user_id;
        localStorage.setItem('currentUserId', currentUserId);

        displayMessage('authMessage', 'Login successful!', false);
        updateAuthInfo();
    } else {
        displayMessage('authMessage', 'Login failed: Invalid credentials or API error.', true);
    }
}

function logout() {
    authToken = '';
    currentUserId = '';
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserId');
    displayMessage('authMessage', 'Logged out.', false);
    updateAuthInfo();
}

// --- Project Functions ---
async function getProjects() {
    await apiCall('GET', '/projects', null, 'projectMessage');
}

async function getProjectById() {
    const id = document.getElementById('projectId').value;
    if (!id) { displayMessage('projectMessage', 'Please enter a Project ID.', true); return; }
    await apiCall('GET', `/projects/${id}`, null, 'projectMessage');
}

async function createProject() {
    const name = document.getElementById('createProjectName').value;
    const description = document.getElementById('createProjectDesc').value;
    if (!name || !description) { displayMessage('projectMessage', 'Project name and description are required.', true); return; }
    const body = { name, description };
    await apiCall('POST', '/projects', body, 'projectMessage');
}

async function updateProject() {
    const id = document.getElementById('updateProjectId').value;
    const name = document.getElementById('updateProjectName').value;
    const description = document.getElementById('updateProjectDesc').value;
    if (!id) { displayMessage('projectMessage', 'Please enter a Project ID to update.', true); return; }
    if (!name && !description) { displayMessage('projectMessage', 'At least one field (name or description) is required for update.', true); return; }
    
    const body = {};
    if (name) body.name = name;
    if (description) body.description = description;

    await apiCall('PUT', `/projects/${id}`, body, 'projectMessage');
}

async function deleteProject() {
    const id = document.getElementById('deleteProjectId').value;
    if (!id) { displayMessage('projectMessage', 'Please enter a Project ID to delete.', true); return; }
    await apiCall('DELETE', `/projects/${id}`, null, 'projectMessage');
}

// --- Task Functions ---
async function getTasks() {
    await apiCall('GET', '/tasks', null, 'taskMessage');
}

async function getTaskById() {
    const id = document.getElementById('taskId').value;
    if (!id) { displayMessage('taskMessage', 'Please enter a Task ID.', true); return; }
    await apiCall('GET', `/tasks/${id}`, null, 'taskMessage');
}

async function createTask() {
    const title = document.getElementById('createTaskTitle').value;
    const description = document.getElementById('createTaskDesc').value;
    const projectId = document.getElementById('createTaskProjectId').value;
    const assignedUserId = document.getElementById('createTaskAssignedUserId').value;
    const status = document.getElementById('createTaskStatus').value;
    const dueDate = document.getElementById('createTaskDueDate').value;

    if (!title || !projectId || !assignedUserId) {
        displayMessage('taskMessage', 'Task title, project ID, and assigned user ID are required.', true);
        return;
    }

    const body = {
        title,
        description,
        project_id: parseInt(projectId),
        assigned_user_id: parseInt(assignedUserId) || parseInt(currentUserId), // Fallback to current user if not provided
        status: status || 'OPEN',
        due_date: dueDate || ''
    };
    await apiCall('POST', '/tasks', body, 'taskMessage');
}

async function updateTask() {
    const id = document.getElementById('updateTaskId').value;
    const title = document.getElementById('updateTaskTitle').value;
    const description = document.getElementById('updateTaskDesc').value;
    const status = document.getElementById('updateTaskStatus').value;

    if (!id) { displayMessage('taskMessage', 'Please enter a Task ID to update.', true); return; }
    if (!title && !description && !status) { displayMessage('taskMessage', 'At least one field (title, description, or status) is required for update.', true); return; }
    
    const body = {};
    if (title) body.title = title;
    if (description) body.description = description;
    if (status) body.status = status;

    await apiCall('PUT', `/tasks/${id}`, body, 'taskMessage');
}

async function deleteTask() {
    const id = document.getElementById('deleteTaskId').value;
    if (!id) { displayMessage('taskMessage', 'Please enter a Task ID to delete.', true); return; }
    await apiCall('DELETE', `/tasks/${id}`, null, 'taskMessage');
}

// Initialize UI
document.addEventListener('DOMContentLoaded', updateAuthInfo);
```