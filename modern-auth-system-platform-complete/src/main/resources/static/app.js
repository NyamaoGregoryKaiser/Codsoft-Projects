document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.origin; // Or 'http://localhost:8080' if running frontend separately

    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const updateProfileForm = document.getElementById('update-profile-form');
    const fetchUsersBtn = document.getElementById('fetch-users-btn');
    const userList = document.getElementById('user-list');
    const adminPanel = document.getElementById('admin-panel');

    const currentUsernameSpan = document.getElementById('current-username');
    const profileIdSpan = document.getElementById('profile-id');
    const profileUsernameSpan = document.getElementById('profile-username');
    const profileEmailSpan = document.getElementById('profile-email');
    const profileRolesSpan = document.getElementById('profile-roles');

    const messageArea = document.getElementById('message-area');

    let jwtToken = localStorage.getItem('jwtToken');
    let userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

    function showMessage(type, message) {
        messageArea.className = `message ${type}`;
        messageArea.textContent = message;
        messageArea.classList.remove('hidden');
        setTimeout(() => messageArea.classList.add('hidden'), 5000);
    }

    async function fetchData(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (jwtToken) {
            headers['Authorization'] = `Bearer ${jwtToken}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden - token might be expired or invalid
            logout();
            showMessage('error', 'Session expired or unauthorized. Please log in again.');
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Something went wrong');
        }

        return response.json().catch(() => response.text().then(text => text || 'Success')); // Handle empty or non-JSON responses
    }

    function updateUI() {
        if (jwtToken) {
            authSection.classList.add('hidden');
            userSection.classList.remove('hidden');
            currentUsernameSpan.textContent = localStorage.getItem('username');
            fetchUserProfile(); // Fetch user profile when logged in

            if (userRoles.includes('ROLE_ADMIN')) {
                adminPanel.classList.remove('hidden');
            } else {
                adminPanel.classList.add('hidden');
            }
        } else {
            authSection.classList.remove('hidden');
            userSection.classList.add('hidden');
            adminPanel.classList.add('hidden'); // Hide admin panel if logged out
        }
    }

    async function fetchUserProfile() {
        try {
            const profile = await fetchData(`${API_BASE_URL}/api/users/me`);
            if (profile) {
                profileIdSpan.textContent = profile.id;
                profileUsernameSpan.textContent = profile.username;
                profileEmailSpan.textContent = profile.email;
                profileRolesSpan.textContent = profile.roles.map(r => r.name).join(', ');
            }
        } catch (error) {
            showMessage('error', `Failed to load profile: ${error.message}`);
        }
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const response = await fetchData(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });
            showMessage('success', response); // Response is likely a string "User registered successfully!"
            registerForm.reset();
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('error', `Registration failed: ${error.message}`);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const data = await fetchData(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            jwtToken = data.token;
            userRoles = data.roles;

            localStorage.setItem('jwtToken', jwtToken);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userRoles', JSON.stringify(userRoles));

            showMessage('success', `Logged in as ${data.username}`);
            loginForm.reset();
            updateUI();
        } catch (error) {
            console.error('Login error:', error);
            showMessage('error', `Login failed: ${error.message}`);
        }
    });

    logoutBtn.addEventListener('click', () => {
        logout();
        showMessage('success', 'Logged out successfully!');
        updateUI();
    });

    function logout() {
        jwtToken = null;
        userRoles = [];
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRoles');
    }

    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target['update-email'].value;
        const password = e.target['update-password'].value;

        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        if (Object.keys(updateData).length === 0) {
            showMessage('info', 'No changes to update.');
            return;
        }

        try {
            const response = await fetchData(`${API_BASE_URL}/api/users/me`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            showMessage('success', 'Profile updated successfully!');
            updateProfileForm.reset();
            fetchUserProfile(); // Refresh profile info
        } catch (error) {
            console.error('Update profile error:', error);
            showMessage('error', `Failed to update profile: ${error.message}`);
        }
    });

    fetchUsersBtn.addEventListener('click', async () => {
        userList.innerHTML = ''; // Clear previous list
        try {
            const users = await fetchData(`${API_BASE_URL}/api/admin/users`);
            if (users && users.length > 0) {
                users.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = `ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Roles: ${user.roles.map(r => r.name).join(', ')}`;
                    userList.appendChild(li);
                });
            } else {
                userList.innerHTML = '<li>No users found.</li>';
            }
        } catch (error) {
            console.error('Fetch users error:', error);
            showMessage('error', `Failed to fetch users: ${error.message}`);
        }
    });

    // Initial UI update
    updateUI();
});
```

---

**4. Testing & Quality**

**Unit Tests (`src/test/java/com/authapp/service/AuthServiceTest.java`)**
```java