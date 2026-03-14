document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api/v1';
    let userToken = localStorage.getItem('userToken');
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    // DOM Elements
    const sections = ['home', 'login', 'register', 'dashboard'].map(id => document.getElementById(`${id}-section`));
    const authButtons = document.querySelectorAll('.auth-btn');
    const showHomeBtn = document.getElementById('show-home');
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const showDashboardBtn = document.getElementById('show-dashboard');
    const logoutBtn = document.getElementById('logout');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const createContentForm = document.getElementById('create-content-form');
    const editContentForm = document.getElementById('edit-content-form');
    const cancelEditBtn = document.getElementById('cancel-edit');

    const publicContentList = document.getElementById('public-content-list');
    const myContentList = document.getElementById('my-content-list');

    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const createContentMessage = document.getElementById('create-content-message');
    const editContentMessage = document.getElementById('edit-content-message');

    const dashboardUsername = document.getElementById('dashboard-username');
    const dashboardRole = document.getElementById('dashboard-role');
    const editingContentIdSpan = document.getElementById('editing-content-id');

    // Utility Functions
    function showSection(id) {
        sections.forEach(section => {
            section.style.display = (section.id === `${id}-section`) ? 'block' : 'none';
        });
    }

    function updateAuthUI() {
        if (userToken) {
            showLoginBtn.style.display = 'none';
            showRegisterBtn.style.display = 'none';
            showDashboardBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'inline-block';
            dashboardUsername.textContent = currentUser.username || 'Guest';
            dashboardRole.textContent = currentUser.role || 'user';
        } else {
            showLoginBtn.style.display = 'inline-block';
            showRegisterBtn.style.display = 'inline-block';
            showDashboardBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
            dashboardUsername.textContent = '';
            dashboardRole.textContent = '';
        }
    }

    function clearMessages() {
        document.querySelectorAll('.message').forEach(el => el.textContent = '');
    }

    async function fetchData(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
        }

        const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    }

    function renderContent(contentArray, targetElement, isEditable = false) {
        targetElement.innerHTML = '';
        if (contentArray.length === 0) {
            targetElement.innerHTML = '<p>No content available.</p>';
            return;
        }
        contentArray.forEach(content => {
            const div = document.createElement('div');
            div.className = 'content-item';
            div.innerHTML = `
                <h3>${content.title}</h3>
                <p><strong>Status:</strong> ${content.status}</p>
                <p>${content.body.substring(0, 150)}...</p>
                <p><em>Author ID: ${content.author_id}</em></p>
                <p><em>Published: ${content.published_at || 'N/A'}</em></p>
            `;
            if (isEditable) {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => populateEditForm(content);
                div.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.onclick = () => deleteContent(content.id);
                div.appendChild(deleteBtn);
            }
            targetElement.appendChild(div);
        });
    }

    // API Interactions
    async function fetchPublicContent() {
        try {
            const data = await fetchData('/content');
            renderContent(data.data || [], publicContentList);
        } catch (error) {
            console.error('Error fetching public content:', error.message);
            publicContentList.innerHTML = `<p class="error-message">Error loading public content: ${error.message}</p>`;
        }
    }

    async function fetchMyContent() {
        if (!userToken) {
            myContentList.innerHTML = '<p>Please log in to see your content.</p>';
            return;
        }
        try {
            const data = await fetchData('/content'); // All content, filter on client for simplicity.
            const myOwnedContent = (data.data || []).filter(c => c.author_id === currentUser.user_id);
            renderContent(myOwnedContent, myContentList, true);
        } catch (error) {
            console.error('Error fetching my content:', error.message);
            myContentList.innerHTML = `<p class="error-message">Error loading your content: ${error.message}</p>`;
        }
    }

    async function login(username, password) {
        clearMessages();
        try {
            const data = await fetchData('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            userToken = data.data.token;
            currentUser = {
                user_id: data.data.user_id,
                username: data.data.username,
                email: data.data.email,
                role: data.data.role
            };
            localStorage.setItem('userToken', userToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
            showSection('dashboard');
            loginMessage.textContent = 'Login successful!';
            loginMessage.style.color = 'green';
            fetchMyContent();
        } catch (error) {
            console.error('Login failed:', error.message);
            loginMessage.textContent = `Login failed: ${error.message}`;
            loginMessage.style.color = 'red';
        }
    }

    async function register(username, email, password) {
        clearMessages();
        try {
            const data = await fetchData('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });
            registerMessage.textContent = 'Registration successful! You can now log in.';
            registerMessage.style.color = 'green';
            registerForm.reset();
            showSection('login');
        } catch (error) {
            console.error('Registration failed:', error.message);
            registerMessage.textContent = `Registration failed: ${error.message}`;
            registerMessage.style.color = 'red';
        }
    }

    async function createContent(title, body, status) {
        clearMessages();
        try {
            const data = await fetchData('/content', {
                method: 'POST',
                body: JSON.stringify({ title, body, status })
            });
            createContentMessage.textContent = 'Content created successfully!';
            createContentMessage.style.color = 'green';
            createContentForm.reset();
            fetchMyContent();
            fetchPublicContent(); // Update public view too
        } catch (error) {
            console.error('Create content failed:', error.message);
            createContentMessage.textContent = `Error creating content: ${error.message}`;
            createContentMessage.style.color = 'red';
        }
    }

    async function updateContent(id, title, body, status) {
        clearMessages();
        try {
            const data = await fetchData(`/content/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, body, status })
            });
            editContentMessage.textContent = 'Content updated successfully!';
            editContentMessage.style.color = 'green';
            editContentForm.style.display = 'none';
            createContentForm.style.display = 'block';
            editingContentIdSpan.textContent = '';
            fetchMyContent();
            fetchPublicContent(); // Update public view too
        } catch (error) {
            console.error('Update content failed:', error.message);
            editContentMessage.textContent = `Error updating content: ${error.message}`;
            editContentMessage.style.color = 'red';
        }
    }

    async function deleteContent(id) {
        if (!confirm('Are you sure you want to delete this content?')) {
            return;
        }
        try {
            await fetchData(`/content/${id}`, {
                method: 'DELETE'
            });
            alert('Content deleted successfully!');
            fetchMyContent();
            fetchPublicContent(); // Update public view too
        } catch (error) {
            console.error('Delete content failed:', error.message);
            alert(`Error deleting content: ${error.message}`);
        }
    }

    function populateEditForm(content) {
        document.getElementById('edit-content-id').value = content.id;
        document.getElementById('edit-content-title').value = content.title;
        document.getElementById('edit-content-body').value = content.body;
        document.getElementById('edit-content-status').value = content.status;
        editingContentIdSpan.textContent = content.id;

        createContentForm.style.display = 'none';
        editContentForm.style.display = 'block';
        clearMessages();
    }

    // Event Listeners
    showHomeBtn.addEventListener('click', () => {
        showSection('home');
        clearMessages();
        fetchPublicContent();
    });
    showLoginBtn.addEventListener('click', () => {
        showSection('login');
        clearMessages();
    });
    showRegisterBtn.addEventListener('click', () => {
        showSection('register');
        clearMessages();
    });
    showDashboardBtn.addEventListener('click', () => {
        showSection('dashboard');
        clearMessages();
        fetchMyContent();
    });
    logoutBtn.addEventListener('click', () => {
        userToken = null;
        currentUser = {};
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        updateAuthUI();
        showSection('home');
        fetchPublicContent();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        await login(username, password);
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        await register(username, email, password);
    });

    createContentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-content-title').value;
        const body = document.getElementById('new-content-body').value;
        const status = document.getElementById('new-content-status').value;
        await createContent(title, body, status);
    });

    editContentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-content-id').value;
        const title = document.getElementById('edit-content-title').value;
        const body = document.getElementById('edit-content-body').value;
        const status = document.getElementById('edit-content-status').value;
        await updateContent(id, title, body, status);
    });

    cancelEditBtn.addEventListener('click', () => {
        editContentForm.style.display = 'none';
        createContentForm.style.display = 'block';
        editingContentIdSpan.textContent = '';
        clearMessages();
    });

    // Initial load
    updateAuthUI();
    showSection('home');
    fetchPublicContent();
});