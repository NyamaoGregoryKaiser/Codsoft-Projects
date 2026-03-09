```javascript
const API_BASE_URL = "http://localhost:8000/api/v1"; // Or your deployed backend URL

let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let currentUser = null; // Store current user data
let allCategories = []; // To populate category dropdowns

// Helper to handle API requests
async function apiRequest(method, endpoint, data = null, auth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (auth) {
        if (!accessToken) {
            console.error("No access token available for authenticated request.");
            // Potentially trigger a redirect to login or show an error
            showSection('auth');
            throw new Error("Authentication required.");
        }
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const config = {
            method: method,
            headers: headers,
        };
        if (data) {
            config.body = JSON.stringify(data);
        } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            // For methods that typically send a body, send an empty object if no data
            config.body = JSON.stringify({});
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 401 && refreshToken) {
            console.warn("Access token expired, attempting to refresh...");
            const refreshSuccess = await refreshAccessToken();
            if (refreshSuccess) {
                headers['Authorization'] = `Bearer ${accessToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, headers: headers });
                if (!retryResponse.ok) {
                    throw new Error(`API request failed after refresh: ${retryResponse.status} ${retryResponse.statusText}`);
                }
                return retryResponse.json();
            } else {
                console.error("Failed to refresh token. User needs to log in again.");
                logout(); // Log out if refresh failed
                throw new Error("Session expired. Please log in again.");
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(`API request failed: ${response.status} - ${errorData.detail}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in apiRequest:", error);
        throw error;
    }
}

// Token refresh logic
async function refreshAccessToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}` // Use refresh token here
            }
        });

        if (!response.ok) {
            console.error("Refresh token failed:", response.status, response.statusText);
            return false;
        }

        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token; // Refresh token can also be updated
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        console.log("Tokens refreshed successfully.");
        return true;
    } catch (error) {
        console.error("Error during token refresh:", error);
        return false;
    }
}


// UI Management
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(`${sectionId}-section`).classList.remove('d-none');

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[onclick*="showSection('${sectionId}')"]`);
    if (activeLink) activeLink.classList.add('active');

    // Load data for the shown section
    if (sectionId === 'products') fetchProducts();
    if (sectionId === 'cart') fetchCart();
    if (sectionId === 'orders') fetchUserOrders();
    if (sectionId === 'admin-products') fetchAdminProducts();
    if (sectionId === 'admin-users') fetchAdminUsers();
    if (sectionId === 'admin-orders') fetchAdminOrders();
    if (sectionId === 'auth') updateAuthUI();
}

function updateAuthUI() {
    const loginRegisterBtn = document.getElementById('loginRegisterBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (accessToken && currentUser) {
        loginRegisterBtn.classList.add('d-none');
        logoutBtn.classList.remove('d-none');
        welcomeMessage.textContent = `Welcome, ${currentUser.first_name || currentUser.email}!`;
        // Show/hide admin links based on currentUser.is_admin
        document.querySelectorAll('[id^="admin-"]').forEach(el => {
            if (el.id.endsWith('-section')) {
                el.classList.add('d-none'); // Hide section content initially
            }
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.querySelector('a[onclick*="admin-"]')) {
                item.classList.toggle('d-none', !currentUser.is_admin);
            }
        });
    } else {
        loginRegisterBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-none');
        welcomeMessage.textContent = "";
        currentUser = null;
        // Hide all admin links
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.querySelector('a[onclick*="admin-"]')) {
                item.classList.add('d-none');
            }
        });
    }
}

// User authentication
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // Special for OAuth2PasswordRequestForm
            },
            body: new URLSearchParams({
                username: email,
                password: password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed.');
        }

        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        await fetchCurrentUser();
        document.getElementById('authMessage').textContent = 'Login successful!';
        document.getElementById('authMessage').className = 'alert alert-success';
        showSection('products');
    } catch (error) {
        console.error("Login error:", error);
        document.getElementById('authMessage').textContent = `Login failed: ${error.message}`;
        document.getElementById('authMessage').className = 'alert alert-danger';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;

    try {
        const data = await apiRequest('POST', '/auth/register', {
            email, password, first_name: firstName, last_name: lastName
        }, false);
        document.getElementById('authMessage').textContent = `Registration successful for ${data.email}! Please login.`;
        document.getElementById('authMessage').className = 'alert alert-success';
        document.getElementById('registerForm').reset();
    } catch (error) {
        console.error("Registration error:", error);
        document.getElementById('authMessage').textContent = `Registration failed: ${error.message}`;
        document.getElementById('authMessage').className = 'alert alert-danger';
    }
});

async function fetchCurrentUser() {
    try {
        currentUser = await apiRequest('GET', '/auth/me');
        updateAuthUI();
        return true;
    } catch (error) {
        console.error("Failed to fetch current user:", error);
        logout(); // If fetching current user fails, consider the session invalid
        return false;
    }
}

function logout() {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    updateAuthUI();
    document.getElementById('authMessage').textContent = 'You have been logged out.';
    document.getElementById('authMessage').className = 'alert alert-info';
    showSection('auth');
}

// Product Listing
async function fetchProducts() {
    const productListDiv = document.getElementById('productsList');
    productListDiv.innerHTML = '<p>Loading products...</p>';
    const searchTerm = document.getElementById('productSearch').value;
    const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';

    try {
        const products = await apiRequest('GET', `/products/${query}`, null, false); // No auth needed for public products
        productListDiv.innerHTML = '';
        if (products.length === 0) {
            productListDiv.innerHTML = '<p>No products found.</p>';
            return;
        }
        products.forEach(product => {
            productListDiv.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <img src="${product.image_url || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description || 'No description available.'}</p>
                            <p class="card-text"><strong>Price: $${product.price}</strong></p>
                            <p class="card-text">Stock: ${product.stock_quantity}</p>
                            <p class="card-text"><small class="text-muted">Category: ${product.category ? product.category.name : 'N/A'}</small></p>
                            <button class="btn btn-primary btn-sm" onclick="addToCart(${product.id}, 1)" ${!accessToken || product.stock_quantity === 0 ? 'disabled' : ''}>Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        productListDiv.innerHTML = `<p class="text-danger">Failed to load products: ${error.message}</p>`;
    }
}

// Shopping Cart
async function addToCart(productId, quantity) {
    if (!accessToken) {
        alert("Please login to add items to cart.");
        showSection('auth');
        return;
    }
    try {
        await apiRequest('POST', '/orders/cart', { product_id: productId, quantity: quantity });
        alert("Item added to cart!");
        fetchCart(); // Refresh cart view
    } catch (error) {
        console.error("Error adding to cart:", error);
        alert(`Failed to add item to cart: ${error.message}`);
    }
}

async function fetchCart() {
    if (!accessToken) {
        document.getElementById('cartItemsList').innerHTML = '<p>Please login to view your cart.</p>';
        document.getElementById('cartTotal').textContent = '0.00';
        document.getElementById('shippingAddress').setAttribute('disabled', 'true');
        document.querySelector('#cart-section .btn-success').setAttribute('disabled', 'true');
        return;
    }

    const cartItemsListDiv = document.getElementById('cartItemsList');
    cartItemsListDiv.innerHTML = '<p>Loading cart...</p>';
    document.getElementById('cartTotal').textContent = '0.00';
    document.getElementById('shippingAddress').removeAttribute('disabled');
    document.querySelector('#cart-section .btn-success').removeAttribute('disabled');

    try {
        const cartItems = await apiRequest('GET', '/orders/cart');
        cartItemsListDiv.innerHTML = '';
        let total = 0;
        if (cartItems.length === 0) {
            cartItemsListDiv.innerHTML = '<p>Your cart is empty.</p>';
            document.getElementById('shippingAddress').setAttribute('disabled', 'true');
            document.querySelector('#cart-section .btn-success').setAttribute('disabled', 'true');
            return;
        }
        cartItems.forEach(item => {
            const itemTotal = parseFloat(item.product.price) * item.quantity;
            total += itemTotal;
            cartItemsListDiv.innerHTML += `
                <div class="col-md-12 mb-2">
                    <div class="card">
                        <div class="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title">${item.product.name}</h6>
                                <p class="card-text">Price: $${item.product.price} | Quantity: ${item.quantity}</p>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        document.getElementById('cartTotal').textContent = total.toFixed(2);
    } catch (error) {
        console.error("Error fetching cart:", error);
        cartItemsListDiv.innerHTML = `<p class="text-danger">Failed to load cart: ${error.message}</p>`;
    }
}

async function updateCartItemQuantity(cartItemId, newQuantity) {
    try {
        if (newQuantity <= 0) {
            await removeFromCart(cartItemId);
        } else {
            await apiRequest('PUT', `/orders/cart/${cartItemId}`, { quantity: newQuantity });
            alert("Cart item quantity updated!");
            fetchCart();
        }
    } catch (error) {
        console.error("Error updating cart item quantity:", error);
        alert(`Failed to update cart item: ${error.message}`);
    }
}

async function removeFromCart(cartItemId) {
    if (!confirm("Are you sure you want to remove this item from your cart?")) return;
    try {
        await apiRequest('DELETE', `/orders/cart/${cartItemId}`);
        alert("Item removed from cart!");
        fetchCart();
    } catch (error) {
        console.error("Error removing from cart:", error);
        alert(`Failed to remove item: ${error.message}`);
    }
}

async function checkout() {
    const shippingAddress = document.getElementById('shippingAddress').value;
    if (!shippingAddress) {
        document.getElementById('checkoutMessage').textContent = 'Please enter a shipping address.';
        document.getElementById('checkoutMessage').className = 'alert alert-warning';
        return;
    }
    document.getElementById('checkoutMessage').textContent = 'Processing order...';
    document.getElementById('checkoutMessage').className = 'alert alert-info';

    try {
        const order = await apiRequest('POST', `/orders/checkout?shipping_address=${encodeURIComponent(shippingAddress)}`, null);
        document.getElementById('checkoutMessage').textContent = `Order #${order.id} placed successfully!`;
        document.getElementById('checkoutMessage').className = 'alert alert-success';
        document.getElementById('shippingAddress').value = '';
        fetchCart(); // Clear cart display
        fetchUserOrders(); // Show new order in my orders
        showSection('orders');
    } catch (error) {
        console.error("Error during checkout:", error);
        document.getElementById('checkoutMessage').textContent = `Checkout failed: ${error.message}`;
        document.getElementById('checkoutMessage').className = 'alert alert-danger';
    }
}


// User Orders
async function fetchUserOrders() {
    if (!accessToken) {
        document.getElementById('userOrdersList').innerHTML = '<p>Please login to view your orders.</p>';
        return;
    }
    const userOrdersListDiv = document.getElementById('userOrdersList');
    userOrdersListDiv.innerHTML = '<p>Loading orders...</p>';

    try {
        const orders = await apiRequest('GET', '/orders/me/orders');
        userOrdersListDiv.innerHTML = '';
        if (orders.length === 0) {
            userOrdersListDiv.innerHTML = '<p>You have no orders yet.</p>';
            return;
        }
        orders.forEach(order => {
            let orderItemsHtml = order.order_items.map(item => `
                <li>${item.quantity} x ${item.product.name} ($${item.price_at_purchase} each)</li>
            `).join('');
            userOrdersListDiv.innerHTML += `
                <div class="col-md-12 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Order #${order.id}</h5>
                            <p class="card-text">Date: ${new Date(order.order_date).toLocaleDateString()}</p>
                            <p class="card-text">Status: <strong>${order.status}</strong></p>
                            <p class="card-text">Total: $${order.total_amount}</p>
                            <p class="card-text">Shipping Address: ${order.shipping_address}</p>
                            <h6>Items:</h6>
                            <ul>${orderItemsHtml}</ul>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        userOrdersListDiv.innerHTML = `<p class="text-danger">Failed to load orders: ${error.message}</p>`;
    }
}

// Admin Panel - Products
async function fetchAdminProducts() {
    if (!currentUser || !currentUser.is_admin) {
        document.getElementById('adminProductsList').innerHTML = '<p class="text-danger">Access Denied: Admin privileges required.</p>';
        return;
    }

    const adminProductsListDiv = document.getElementById('adminProductsList');
    adminProductsListDiv.innerHTML = '<p>Loading all products...</p>';

    try {
        // Fetch categories for the dropdown
        allCategories = await apiRequest('GET', '/products/categories', null, false);
        const productCategorySelect = document.getElementById('productCategory');
        productCategorySelect.innerHTML = '<option value="">Select Category</option>';
        allCategories.forEach(cat => {
            productCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });

        const products = await apiRequest('GET', '/products/');
        adminProductsListDiv.innerHTML = '';
        products.forEach(product => {
            adminProductsListDiv.innerHTML += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${product.name} (ID: ${product.id})</h5>
                            <p class="card-text">Price: $${product.price} | Stock: ${product.stock_quantity}</p>
                            <p class="card-text">Category: ${product.category ? product.category.name : 'N/A'}</p>
                            <button class="btn btn-warning btn-sm me-2" onclick="editProduct(${product.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching admin products:", error);
        adminProductsListDiv.innerHTML = `<p class="text-danger">Failed to load products: ${error.message}</p>`;
    }
}

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productName = document.getElementById('productName').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productStock = parseInt(document.getElementById('productStock').value);
    const productCategoryId = document.getElementById('productCategory').value;
    const productDescription = document.getElementById('productDescription').value;
    const productImageUrl = document.getElementById('productImageUrl').value;

    const data = {
        name: productName,
        price: productPrice,
        stock_quantity: productStock,
        description: productDescription || null,
        image_url: productImageUrl || null,
        category_id: productCategoryId ? parseInt(productCategoryId) : null
    };

    try {
        await apiRequest('POST', '/products/', data);
        alert("Product added successfully!");
        document.getElementById('addProductForm').reset();
        fetchAdminProducts();
    } catch (error) {
        console.error("Error adding product:", error);
        alert(`Failed to add product: ${error.message}`);
    }
});

async function editProduct(productId) {
    alert("Edit functionality not fully implemented in this basic UI. Implement a modal or new form for this.");
    // Example of fetching product for edit:
    // try {
    //     const product = await apiRequest('GET', `/products/${productId}`);
    //     console.log("Product to edit:", product);
    //     // Populate a form with product data for editing
    // } catch (error) {
    //     console.error("Error fetching product for edit:", error);
    //     alert(`Failed to fetch product for edit: ${error.message}`);
    // }
}

async function deleteProduct(productId) {
    if (!confirm(`Are you sure you want to delete product ID ${productId}?`)) return;
    try {
        await apiRequest('DELETE', `/products/${productId}`);
        alert("Product deleted successfully!");
        fetchAdminProducts();
    } catch (error) {
        console.error("Error deleting product:", error);
        alert(`Failed to delete product: ${error.message}`);
    }
}

// Admin Panel - Users
async function fetchAdminUsers() {
    if (!currentUser || !currentUser.is_admin) {
        document.getElementById('adminUsersList').innerHTML = '<p class="text-danger">Access Denied: Admin privileges required.</p>';
        return;
    }

    const adminUsersListDiv = document.getElementById('adminUsersList');
    adminUsersListDiv.innerHTML = '<p>Loading all users...</p>';

    try {
        const users = await apiRequest('GET', '/users/');
        adminUsersListDiv.innerHTML = '';
        users.forEach(user => {
            adminUsersListDiv.innerHTML += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${user.email} (ID: ${user.id})</h5>
                            <p class="card-text">Name: ${user.first_name || ''} ${user.last_name || ''}</p>
                            <p class="card-text">Admin: ${user.is_admin ? 'Yes' : 'No'} | Active: ${user.is_active ? 'Yes' : 'No'}</p>
                            <button class="btn btn-warning btn-sm me-2" onclick="editUser(${user.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})" ${user.id === currentUser.id ? 'disabled' : ''}>Delete</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching admin users:", error);
        adminUsersListDiv.innerHTML = `<p class="text-danger">Failed to load users: ${error.message}</p>`;
    }
}

async function editUser(userId) {
    alert("Edit user functionality not fully implemented. (e.g., toggle admin/active status)");
    // Example of fetching user for edit:
    // try {
    //     const user = await apiRequest('GET', `/users/${userId}`);
    //     console.log("User to edit:", user);
    //     // Implement a modal to update user properties like is_admin, is_active
    // } catch (error) {
    //     console.error("Error fetching user for edit:", error);
    //     alert(`Failed to fetch user for edit: ${error.message}`);
    // }
}

async function deleteUser(userId) {
    if (!confirm(`Are you sure you want to delete user ID ${userId}?`)) return;
    try {
        await apiRequest('DELETE', `/users/${userId}`);
        alert("User deleted successfully!");
        fetchAdminUsers();
    } catch (error) {
        console.error("Error deleting user:", error);
        alert(`Failed to delete user: ${error.message}`);
    }
}


// Admin Panel - Orders
async function fetchAdminOrders() {
    if (!currentUser || !currentUser.is_admin) {
        document.getElementById('adminOrdersList').innerHTML = '<p class="text-danger">Access Denied: Admin privileges required.</p>';
        return;
    }

    const adminOrdersListDiv = document.getElementById('adminOrdersList');
    adminOrdersListDiv.innerHTML = '<p>Loading all orders...</p>';

    try {
        const orders = await apiRequest('GET', '/orders/');
        adminOrdersListDiv.innerHTML = '';
        orders.forEach(order => {
            let orderItemsHtml = order.order_items.map(item => `
                <li>${item.quantity} x ${item.product.name} ($${item.price_at_purchase} each)</li>
            `).join('');

            const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => `
                <option value="${s}" ${order.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
            `).join('');

            adminOrdersListDiv.innerHTML += `
                <div class="col-md-12 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Order #${order.id} for ${order.user.email}</h5>
                            <p class="card-text">Date: ${new Date(order.order_date).toLocaleDateString()} | Total: $${order.total_amount}</p>
                            <p class="card-text">Shipping Address: ${order.shipping_address}</p>
                            <div class="d-flex align-items-center mb-2">
                                <label for="orderStatus-${order.id}" class="form-label me-2 mb-0">Status:</label>
                                <select class="form-select w-auto" id="orderStatus-${order.id}" onchange="updateOrderStatus(${order.id}, this.value)">
                                    ${statusOptions}
                                </select>
                            </div>
                            <h6>Items:</h6>
                            <ul>${orderItemsHtml}</ul>
                            <button class="btn btn-danger btn-sm mt-2" onclick="deleteOrder(${order.id})">Delete Order</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        adminOrdersListDiv.innerHTML = `<p class="text-danger">Failed to load orders: ${error.message}</p>`;
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiRequest('PATCH', `/orders/${orderId}/status?status_update=${newStatus}`);
        alert(`Order #${orderId} status updated to ${newStatus}!`);
        fetchAdminOrders(); // Refresh list
    } catch (error) {
        console.error(`Error updating order ${orderId} status:`, error);
        alert(`Failed to update order status: ${error.message}`);
    }
}

async function deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to delete Order ID ${orderId}? This action cannot be undone.`)) return;
    try {
        await apiRequest('DELETE', `/orders/${orderId}`);
        alert("Order deleted successfully!");
        fetchAdminOrders(); // Refresh list
    } catch (error) {
        console.error(`Error deleting order ${orderId}:`, error);
        alert(`Failed to delete order: ${error.message}`);
    }
}


// Initial check and load
document.addEventListener('DOMContentLoaded', async () => {
    if (accessToken) {
        await fetchCurrentUser();
        showSection('products'); // Default to products if logged in
    } else {
        showSection('auth'); // Default to auth if not logged in
    }
});

```