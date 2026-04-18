```javascript
const API_BASE_URL = window.location.origin; // Dynamically get origin

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const authMessage = document.getElementById('authMessage');
const createJobMessage = document.getElementById('createJobMessage');

const registerFormDiv = document.getElementById('registerForm');
const loginFormDiv = document.getElementById('loginForm');
const createJobFormDiv = document.getElementById('createJobForm');
const jobsListDiv = document.getElementById('jobsList');
const jobDataDetailsDiv = document.getElementById('jobDataDetails');
const jobLogsDetailsDiv = document.getElementById('jobLogsDetails');

const showRegisterFormBtn = document.getElementById('showRegisterFormBtn');
const showLoginFormBtn = document.getElementById('showLoginFormBtn');
const showCreateJobFormBtn = document.getElementById('showCreateJobFormBtn');
const cancelCreateJobBtn = document.getElementById('cancelCreateJobBtn');
const refreshJobsBtn = document.getElementById('refreshJobsBtn');
const logoutBtn = document.getElementById('logoutBtn');

const registerForm = document.getElementById('register');
const loginForm = document.getElementById('login');
const createJobForm = document.getElementById('createJob');

let accessToken = localStorage.getItem('accessToken');

// --- Utility Functions ---
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

function hideMessage(element) {
    element.style.display = 'none';
    element.textContent = '';
}

function isAuthenticated() {
    return !!accessToken;
}

function updateUI() {
    if (isAuthenticated()) {
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        showRegisterFormBtn.style.display = 'none';
        showLoginFormBtn.style.display = 'none';
        fetchJobs();
    } else {
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        logoutBtn.style.display = 'none';
        showRegisterFormBtn.style.display = 'inline-block';
        showLoginFormBtn.style.display = 'inline-block';
        loginFormDiv.style.display = 'block'; // Default to login form
        registerFormDiv.style.display = 'none';
    }
    hideMessage(authMessage);
    hideMessage(createJobMessage);
    createJobFormDiv.style.display = 'none'; // Hide create job form by default
    jobDataDetailsDiv.style.display = 'none';
    jobLogsDetailsDiv.style.display = 'none';
}

async function apiRequest(method, path, body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config = {
        method: method,
        headers: headers,
    };
    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, config);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'API request failed');
    }
    return response.status === 204 ? null : response.json(); // Handle No Content
}

// --- Event Handlers ---

showRegisterFormBtn.addEventListener('click', () => {
    registerFormDiv.style.display = 'block';
    loginFormDiv.style.display = 'none';
    hideMessage(authMessage);
});

showLoginFormBtn.addEventListener('click', () => {
    loginFormDiv.style.display = 'block';
    registerFormDiv.style.display = 'none';
    hideMessage(authMessage);
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('accessToken');
    accessToken = null;
    showMessage(authMessage, 'Logged out successfully.', 'success');
    updateUI();
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.regUsername.value;
    const email = e.target.regEmail.value;
    const password = e.target.regPassword.value;

    try {
        await apiRequest('POST', '/api/auth/register', { username, email, password });
        showMessage(authMessage, 'Registration successful! Please log in.', 'success');
        e.target.reset();
        loginFormDiv.style.display = 'block';
        registerFormDiv.style.display = 'none';
    } catch (error) {
        showMessage(authMessage, `Registration failed: ${error.message}`, 'error');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.loginUsername.value;
    const password = e.target.loginPassword.value;

    try {
        const data = await apiRequest('POST', '/api/auth/login', { username, password });
        accessToken = data.accessToken;
        localStorage.setItem('accessToken', accessToken);
        showMessage(authMessage, 'Login successful!', 'success');
        e.target.reset();
        updateUI();
    } catch (error) {
        showMessage(authMessage, `Login failed: ${error.message}`, 'error');
    }
});

showCreateJobFormBtn.addEventListener('click', () => {
    createJobFormDiv.style.display = 'block';
    jobsListDiv.style.display = 'none';
    hideMessage(createJobMessage);
});

cancelCreateJobBtn.addEventListener('click', () => {
    createJobFormDiv.style.display = 'none';
    jobsListDiv.style.display = 'grid'; // Assuming it's a grid when showing jobs
    createJobForm.reset();
    hideMessage(createJobMessage);
});

createJobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.jobName.value;
    const targetUrl = e.target.targetUrl.value;
    let config;
    try {
        config = JSON.parse(e.target.config.value);
    } catch (err) {
        showMessage(createJobMessage, 'Invalid JSON in config field.', 'error');
        return;
    }
    const cronSchedule = e.target.cronSchedule.value || null;

    try {
        await apiRequest('POST', '/api/jobs', { name, targetUrl, config, cronSchedule });
        showMessage(createJobMessage, 'Scraping job created successfully!', 'success');
        e.target.reset();
        createJobFormDiv.style.display = 'none';
        jobsListDiv.style.display = 'grid';
        fetchJobs();
    } catch (error) {
        showMessage(createJobMessage, `Failed to create job: ${error.message}`, 'error');
    }
});

refreshJobsBtn.addEventListener('click', fetchJobs);

// --- Job Management Functions ---

async function fetchJobs() {
    jobsListDiv.innerHTML = '<p>Loading jobs...</p>';
    try {
        const jobs = await apiRequest('GET', '/api/jobs');
        renderJobs(jobs);
    } catch (error) {
        jobsListDiv.innerHTML = `<p class="message error">Failed to load jobs: ${error.message}</p>`;
    }
}

function renderJobs(jobs) {
    jobsListDiv.innerHTML = '';
    if (jobs.length === 0) {
        jobsListDiv.innerHTML = '<p>No scraping jobs defined yet. Create one!</p>';
        return;
    }

    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <h4>${job.name}</h4>
            <p><strong>URL:</strong> <a href="${job.targetUrl}" target="_blank">${job.targetUrl.substring(0, 50)}...</a></p>
            <p><strong>Status:</strong> <span class="status ${job.status}">${job.status}</span></p>
            <p><strong>Schedule:</strong> ${job.cronSchedule || 'Manual'}</p>
            <p><strong>Last Run:</strong> ${job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never'}</p>
            <p><strong>Next Run:</strong> ${job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : 'N/A'}</p>
            <div class="job-actions">
                <button class="run-btn" data-job-id="${job.id}">Run Now</button>
                <button class="view-data-btn" data-job-id="${job.id}" data-job-name="${job.name}">View Data</button>
                <button class="view-logs-btn" data-job-id="${job.id}" data-job-name="${job.name}">View Logs</button>
                <button class="delete-btn" data-job-id="${job.id}">Delete</button>
            </div>
        `;
        jobsListDiv.appendChild(jobCard);
    });

    // Attach event listeners to new buttons
    document.querySelectorAll('.run-btn').forEach(btn => btn.addEventListener('click', handleRunJob));
    document.querySelectorAll('.view-data-btn').forEach(btn => btn.addEventListener('click', handleViewData));
    document.querySelectorAll('.view-logs-btn').forEach(btn => btn.addEventListener('click', handleViewLogs));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteJob));
}

async function handleRunJob(event) {
    const jobId = event.target.dataset.jobId;
    if (confirm('Are you sure you want to run this job now?')) {
        try {
            await apiRequest('POST', `/api/jobs/${jobId}/run`);
            alert('Job triggered successfully! Status will update shortly.');
            fetchJobs(); // Refresh job list to see status change
        } catch (error) {
            alert(`Failed to trigger job: ${error.message}`);
        }
    }
}

async function handleDeleteJob(event) {
    const jobId = event.target.dataset.jobId;
    if (confirm('Are you sure you want to delete this job and all its scraped data? This cannot be undone.')) {
        try {
            await apiRequest('DELETE', `/api/jobs/${jobId}`);
            alert('Job deleted successfully!');
            fetchJobs(); // Refresh job list
        } catch (error) {
            alert(`Failed to delete job: ${error.message}`);
        }
    }
}

async function handleViewData(event) {
    const jobId = event.target.dataset.jobId;
    const jobName = event.target.dataset.jobName;
    document.getElementById('jobDataTitle').textContent = jobName;
    document.getElementById('jobDataContent').innerHTML = '<p>Loading data...</p>';
    jobDataDetailsDiv.style.display = 'block';
    jobsListDiv.style.display = 'none';

    try {
        const dataPage = await apiRequest('GET', `/api/jobs/${jobId}/data?page=0&size=50`); // Fetch first 50 items
        const dataItems = dataPage.content;
        document.getElementById('jobDataContent').innerHTML = '';
        if (dataItems.length === 0) {
            document.getElementById('jobDataContent').innerHTML = '<p>No scraped data found for this job.</p>';
            return;
        }
        dataItems.forEach(item => {
            const dataItemDiv = document.createElement('div');
            dataItemDiv.className = 'data-item';
            dataItemDiv.innerHTML = `<p><strong>ID:</strong> ${item.id}</p>
                                    <p><strong>Scraped URL:</strong> <a href="${item.scrapedUrl}" target="_blank">${item.scrapedUrl.substring(0, 100)}...</a></p>
                                    <p><strong>Scraped At:</strong> ${new Date(item.scrapedAt).toLocaleString()}</p>
                                    <p><strong>Data:</strong></p>
                                    <pre>${JSON.stringify(item.data, null, 2)}</pre>`;
            document.getElementById('jobDataContent').appendChild(dataItemDiv);
        });
        if (dataPage.totalPages > 1) {
            document.getElementById('jobDataContent').innerHTML += `<p><em>Showing first ${dataItems.length} items. Total: ${dataPage.totalElements}. Use API for full pagination.</em></p>`;
        }

    } catch (error) {
        document.getElementById('jobDataContent').innerHTML = `<p class="message error">Failed to load data: ${error.message}</p>`;
    }
}

async function handleViewLogs(event) {
    const jobId = event.target.dataset.jobId;
    const jobName = event.target.dataset.jobName;
    document.getElementById('jobLogsTitle').textContent = jobName;
    document.getElementById('jobLogsContent').innerHTML = '<p>Loading logs...</p>';
    jobLogsDetailsDiv.style.display = 'block';
    jobsListDiv.style.display = 'none';

    try {
        const logsPage = await apiRequest('GET', `/api/jobs/${jobId}/logs?page=0&size=20`); // Fetch last 20 logs
        const logItems = logsPage.content;
        document.getElementById('jobLogsContent').innerHTML = '';
        if (logItems.length === 0) {
            document.getElementById('jobLogsContent').innerHTML = '<p>No execution logs found for this job.</p>';
            return;
        }
        logItems.forEach(item => {
            const logItemDiv = document.createElement('div');
            logItemDiv.className = 'log-item';
            logItemDiv.innerHTML = `<p><strong>Status:</strong> <span class="status ${item.status}">${item.status}</span></p>
                                    <p><strong>Start Time:</strong> ${new Date(item.startTime).toLocaleString()}</p>
                                    <p><strong>End Time:</strong> ${item.endTime ? new Date(item.endTime).toLocaleString() : 'N/A'}</p>
                                    ${item.errorMessage ? `<p class="message error"><strong>Error:</strong> ${item.errorMessage}</p>` : ''}
                                    <p><strong>Data Count:</strong> ${item.dataCount !== null ? item.dataCount : 'N/A'}</p>`;
            document.getElementById('jobLogsContent').appendChild(logItemDiv);
        });
        if (logsPage.totalPages > 1) {
            document.getElementById('jobLogsContent').innerHTML += `<p><em>Showing last ${logItems.length} logs. Total: ${logsPage.totalElements}. Use API for full pagination.</em></p>`;
        }

    } catch (error) {
        document.getElementById('jobLogsContent').innerHTML = `<p class="message error">Failed to load logs: ${error.message}</p>`;
    }
}

document.querySelectorAll('.close-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        jobDataDetailsDiv.style.display = 'none';
        jobLogsDetailsDiv.style.display = 'none';
        jobsListDiv.style.display = 'grid'; // Show jobs list again
    });
});

// Initial UI update on page load
updateUI();

```