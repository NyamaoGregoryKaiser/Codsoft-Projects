```javascript
const BASE_URL = 'http://localhost:8080'; // Adjust if your backend is on a different host/port

// Utility functions
const getElement = (id) => document.getElementById(id);
const showMessage = (element, msg, type) => {
    element.textContent = msg;
    element.className = `message ${type}`;
    element.style.display = 'block';
};
const clearMessage = (element) => {
    element.textContent = '';
    element.className = 'message';
    element.style.display = 'none';
};

const storeTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

const isAuthenticated = () => !!getAccessToken();

const updateUI = () => {
    if (isAuthenticated()) {
        getElement('login-section').style.display = 'none';
        getElement('register-section').style.display = 'none';
        getElement('profile-section').style.display = 'block';
        getElement('logout-button').style.display = 'block';
        fetchUserProfile();
    } else {
        getElement('login-section').style.display = 'block';
        getElement('register-section').style.display = 'block';
        getElement('profile-section').style.display = 'none';
        getElement('logout-button').style.display = 'none';
        clearProfileDetails();
    }
};

const clearProfileDetails = () => {
    getElement('profile-username-display').textContent = '';
    getElement('profile-id').textContent = '';
    getElement('profile-email').textContent = '';
    getElement('profile-created-at').textContent = '';
    getElement('profile-updated-at').textContent = '';
    getElement('update-username').value = '';
    getElement('update-email').value = '';
    getElement('update-password').value = '';
};

// API Interactions
const apiCall = async (endpoint, method, body = null, authRequired = false) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (authRequired) {
        const token = getAccessToken();
        if (!token) {
            throw new Error('No access token found. Please log in.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        // Handle specific error types or refresh token if 401
        if (response.status === 401 && authRequired && data.message === "Invalid or expired access token.") {
            console.warn("Access token expired or invalid, attempting to refresh...");
            const success = await refreshAccessToken();
            if (success) {
                // Retry the original call with the new access token
                console.log("Token refreshed, retrying original request...");
                return apiCall(endpoint, method, body, authRequired);
            } else {
                console.error("Failed to refresh token, logging out.");
                clearTokens();
                updateUI();
                throw new Error("Session expired. Please log in again.");
            }
        }
        throw new Error(data.message || 'Something went wrong.');
    }
    return data;
};

const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }

    try {
        const data = await apiCall('/refresh-token', 'POST', { refresh_token: refreshToken });
        if (data.status === 'success') {
            localStorage.setItem('accessToken', data.data.access_token);
            // Optionally update expires_in if needed by frontend
            return true;
        }
    } catch (error) {
        console.error('Refresh token failed:', error.message);
    }
    return false;
};

const fetchUserProfile = async () => {
    try {
        const data = await apiCall('/me', 'GET', null, true);
        if (data.status === 'success') {
            const user = data.data;
            getElement('profile-username-display').textContent = user.username;
            getElement('profile-id').textContent = user.id;
            getElement('profile-email').textContent = user.email;
            getElement('profile-created-at').textContent = new Date(user.created_at + 'Z').toLocaleString(); // Add Z for UTC
            getElement('profile-updated-at').textContent = new Date(user.updated_at + 'Z').toLocaleString(); // Add Z for UTC

            getElement('update-username').value = user.username;
            getElement('update-email').value = user.email;
            clearMessage(getElement('profile-message'));
        }
    } catch (error) {
        showMessage(getElement('profile-message'), error.message, 'error');
        if (error.message === "Session expired. Please log in again.") {
            clearTokens();
            updateUI();
        }
    }
};

// Event Listeners
getElement('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = getElement('register-username').value;
    const email = getElement('register-email').value;
    const password = getElement('register-password').value;

    try {
        const data = await apiCall('/register', 'POST', { username, email, password });
        showMessage(getElement('register-message'), data.message, 'success');
        getElement('register-form').reset();
    } catch (error) {
        showMessage(getElement('register-message'), error.message, 'error');
    }
});

getElement('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = getElement('login-email').value;
    const password = getElement('login-password').value;

    try {
        const data = await apiCall('/login', 'POST', { email, password });
        showMessage(getElement('login-message'), data.message, 'success');
        storeTokens(data.data.access_token, data.data.refresh_token);
        updateUI();
    } catch (error) {
        showMessage(getElement('login-message'), error.message, 'error');
    }
});

getElement('logout-button').addEventListener('click', () => {
    clearTokens();
    showMessage(getElement('login-message'), 'Logged out successfully.', 'success');
    updateUI();
});

getElement('update-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = getElement('update-username').value;
    const email = getElement('update-email').value;
    const password = getElement('update-password').value;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    try {
        const data = await apiCall('/me', 'PUT', updateData, true);
        showMessage(getElement('profile-message'), data.message, 'success');
        fetchUserProfile(); // Refresh profile data
    } catch (error) {
        showMessage(getElement('profile-message'), error.message, 'error');
    }
});

getElement('delete-profile-button').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    try {
        await apiCall('/me', 'DELETE', null, true);
        showMessage(getElement('login-message'), 'Account deleted successfully. Please register again.', 'success');
        clearTokens();
        updateUI();
    } catch (error) {
        showMessage(getElement('profile-message'), error.message, 'error');
    }
});

// Initial UI update on page load
document.addEventListener('DOMContentLoaded', updateUI);
```