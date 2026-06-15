```javascript
const BASE_URL = 'http://localhost:8080/api/v1'; // Adjust if your backend runs on a different host/port

let jwtToken = localStorage.getItem('jwtToken') || null;
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let loggedInUsername = localStorage.getItem('loggedInUsername') || null;

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginStatus = document.getElementById('login-status');
const createStatus = document.getElementById('create-status');
const productListDiv = document.getElementById('productList');
const loggedInUserSpan = document.getElementById('loggedInUser');
const userRoleSpan = document.getElementById('userRole');
const newProductName = document.getElementById('newProductName');
const newProductDescription = document.getElementById('newProductDescription');
const newProductPrice = document.getElementById('newProductPrice');
const newProductStock = document.getElementById('newProductStock');
const newProductCategory = document.getElementById('newProductCategory');


function updateUI() {
    if (jwtToken) {
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        loggedInUserSpan.textContent = loggedInUsername;
        userRoleSpan.textContent = isAdmin ? 'Administrator' : 'User';

        // Disable create/update/delete if not admin
        document.querySelector('button[onclick="createProduct()"]').disabled = !isAdmin;
        // For existing products, dynamically disable/enable controls
        document.querySelectorAll('.product-item .controls button').forEach(button => {
            button.disabled = !isAdmin;
        });

        fetchProducts();
    } else {
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        productListDiv.innerHTML = '<p>No products loaded yet.</p>';
        loginStatus.textContent = '';
        createStatus.textContent = '';
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            jwtToken = data.token;
            localStorage.setItem('jwtToken', jwtToken);

            // Decode JWT to get user role (simplified)
            // In a real app, parse JWT securely or get role from login response
            const payloadBase64 = jwtToken.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            isAdmin = decodedPayload.isAdmin === 'true'; // JWT claim stores as string
            loggedInUsername = decodedPayload.username;

            localStorage.setItem('isAdmin', isAdmin);
            localStorage.setItem('loggedInUsername', loggedInUsername);

            loginStatus.className = 'success';
            loginStatus.textContent = 'Login successful!';
            updateUI();
        } else {
            loginStatus.className = 'error';
            loginStatus.textContent = data.message || 'Login failed.';
            jwtToken = null;
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('loggedInUsername');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginStatus.className = 'error';
        loginStatus.textContent = 'Network error during login.';
    }
}

function logout() {
    jwtToken = null;
    isAdmin = false;
    loggedInUsername = null;
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('loggedInUsername');
    updateUI();
    loginStatus.className = 'success';
    loginStatus.textContent = 'Logged out successfully.';
}

async function fetchProducts() {
    if (!jwtToken) {
        productListDiv.innerHTML = '<p class="error">Please log in to view products.</p>';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            renderProducts(products);
        } else if (response.status === 401) {
            // Token expired or invalid
            alert('Your session has expired. Please log in again.');
            logout();
        } else {
            const errorData = await response.json();
            productListDiv.innerHTML = `<p class="error">Error fetching products: ${errorData.message || response.statusText}</p>`;
        }
    } catch (error) {
        console.error('Fetch products error:', error);
        productListDiv.innerHTML = `<p class="error">Network error fetching products.</p>`;
    }
}

function renderProducts(products) {
    productListDiv.innerHTML = '';
    if (products.length === 0) {
        productListDiv.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <strong>ID:</strong> ${product.id}<br>
            <strong>Name:</strong> <span id="name-${product.id}">${product.name}</span><br>
            <strong>Description:</strong> <span id="description-${product.id}">${product.description || 'N/A'}</span><br>
            <strong>Price:</strong> $<span id="price-${product.id}">${product.price.toFixed(2)}</span><br>
            <strong>Stock:</strong> <span id="stock-${product.id}">${product.stock}</span><br>
            <strong>Category:</strong> <span id="category-${product.id}">${product.category || 'N/A'}</span><br>
            <div class="controls">
                <button onclick="showUpdateForm('${product.id}')" ${!isAdmin ? 'disabled' : ''}>Update</button>
                <button onclick="deleteProduct('${product.id}')" ${!isAdmin ? 'disabled' : ''}>Delete</button>
            </div>
            <div id="updateForm-${product.id}" style="display:none; margin-top:10px;">
                <input type="text" id="updateName-${product.id}" value="${product.name}" placeholder="Name"><br>
                <textarea id="updateDescription-${product.id}" placeholder="Description">${product.description || ''}</textarea><br>
                <input type="number" id="updatePrice-${product.id}" step="0.01" value="${product.price}" placeholder="Price"><br>
                <input type="number" id="updateStock-${product.id}" value="${product.stock}" placeholder="Stock"><br>
                <input type="text" id="updateCategory-${product.id}" value="${product.category || ''}" placeholder="Category"><br>
                <button onclick="updateProduct('${product.id}')">Save</button>
                <button onclick="cancelUpdate('${product.id}')">Cancel</button>
            </div>
        `;
        productListDiv.appendChild(productItem);
    });
}

async function createProduct() {
    if (!jwtToken || !isAdmin) {
        createStatus.className = 'error';
        createStatus.textContent = 'You are not authorized to create products.';
        return;
    }

    const productData = {
        name: newProductName.value,
        description: newProductDescription.value,
        price: parseFloat(newProductPrice.value),
        stock: parseInt(newProductStock.value),
        category: newProductCategory.value
    };

    if (!productData.name || isNaN(productData.price) || isNaN(productData.stock)) {
        createStatus.className = 'error';
        createStatus.textContent = 'Please fill in all required fields (Name, Price, Stock).';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();
        if (response.ok) {
            createStatus.className = 'success';
            createStatus.textContent = `Product "${data.name}" created successfully!`;
            newProductName.value = '';
            newProductDescription.value = '';
            newProductPrice.value = 0;
            newProductStock.value = 0;
            newProductCategory.value = '';
            fetchProducts(); // Refresh list
        } else {
            createStatus.className = 'error';
            createStatus.textContent = data.message || `Error creating product: ${response.statusText}`;
        }
    } catch (error) {
        console.error('Create product error:', error);
        createStatus.className = 'error';
        createStatus.textContent = 'Network error during product creation.';
    }
}

function showUpdateForm(id) {
    document.getElementById(`updateForm-${id}`).style.display = 'block';
    // Populate form with current values
    document.getElementById(`updateName-${id}`).value = document.getElementById(`name-${id}`).textContent;
    document.getElementById(`updateDescription-${id}`).value = document.getElementById(`description-${id}`).textContent === 'N/A' ? '' : document.getElementById(`description-${id}`).textContent;
    document.getElementById(`updatePrice-${id}`).value = parseFloat(document.getElementById(`price-${id}`).textContent);
    document.getElementById(`updateStock-${id}`).value = parseInt(document.getElementById(`stock-${id}`).textContent);
    document.getElementById(`updateCategory-${id}`).value = document.getElementById(`category-${id}`).textContent === 'N/A' ? '' : document.getElementById(`category-${id}`).textContent;
}

function cancelUpdate(id) {
    document.getElementById(`updateForm-${id}`).style.display = 'none';
}

async function updateProduct(id) {
    if (!jwtToken || !isAdmin) {
        alert('You are not authorized to update products.');
        return;
    }

    const updatedData = {
        name: document.getElementById(`updateName-${id}`).value,
        description: document.getElementById(`updateDescription-${id}`).value,
        price: parseFloat(document.getElementById(`updatePrice-${id}`).value),
        stock: parseInt(document.getElementById(`updateStock-${id}`).value),
        category: document.getElementById(`updateCategory-${id}`).value
    };

    if (!updatedData.name || isNaN(updatedData.price) || isNaN(updatedData.stock)) {
        alert('Please fill in all required fields (Name, Price, Stock) for update.');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();
        if (response.ok) {
            alert(`Product "${data.name}" updated successfully!`);
            cancelUpdate(id);
            fetchProducts(); // Refresh list
        } else {
            alert(data.message || `Error updating product: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Update product error:', error);
        alert('Network error during product update.');
    }
}

async function deleteProduct(id) {
    if (!jwtToken || !isAdmin) {
        alert('You are not authorized to delete products.');
        return;
    }

    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (response.ok) {
            alert('Product deleted successfully!');
            fetchProducts(); // Refresh list
        } else {
            const errorData = await response.json();
            alert(errorData.message || `Error deleting product: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Delete product error:', error);
        alert('Network error during product deletion.');
    }
}

// Initial UI update on page load
updateUI();
```