// src/mocks/handlers.js
import { rest } from 'msw';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const users = [
  { id: 'admin1', username: 'admin', email: 'admin@example.com', role: 'admin' },
  { id: 'user1', username: 'testuser', email: 'user@example.com', role: 'user' },
];

let products = [
  { id: 'prod1', name: 'Laptop Pro', description: 'Powerful laptop', price: 1200, stock: 50, imageUrl: 'https://via.placeholder.com/150', userId: 'admin1', owner: users[0] },
  { id: 'prod2', name: 'Wireless Mouse', description: 'Ergonomic mouse', price: 25, stock: 200, imageUrl: 'https://via.placeholder.com/150', userId: 'user1', owner: users[1] },
];

export const handlers = [
  // Auth Handlers
  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body;
    if (email === 'admin@example.com' && password === 'adminpassword') {
      return res(
        ctx.status(200),
        ctx.json({
          status: 'success',
          token: 'mock-admin-token',
          data: { user: { id: 'admin1', username: 'admin', email: 'admin@example.com', role: 'admin' } },
        })
      );
    }
    if (email === 'user@example.com' && password === 'userpassword') {
      return res(
        ctx.status(200),
        ctx.json({
          status: 'success',
          token: 'mock-user-token',
          data: { user: { id: 'user1', username: 'testuser', email: 'user@example.com', role: 'user' } },
        })
      );
    }
    return res(ctx.status(401), ctx.json({ status: 'error', message: 'Incorrect email or password' }));
  }),

  rest.post(`${API_BASE_URL}/auth/register`, (req, res, ctx) => {
    const { username, email, password } = req.body;
    if (users.some(u => u.email === email || u.username === username)) {
      return res(ctx.status(409), ctx.json({ status: 'error', message: 'Email or username already registered.' }));
    }
    const newUser = { id: uuidv4(), username, email, password, role: 'user' };
    users.push(newUser);
    return res(
      ctx.status(201),
      ctx.json({
        status: 'success',
        token: 'mock-new-user-token',
        data: { user: newUser },
      })
    );
  }),

  rest.get(`${API_BASE_URL}/auth/me`, (req, res, ctx) => {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (token === 'mock-admin-token') {
      return res(ctx.status(200), ctx.json({ status: 'success', data: { user: users[0] } }));
    }
    if (token === 'mock-user-token') {
      return res(ctx.status(200), ctx.json({ status: 'success', data: { user: users[1] } }));
    }
    if (token === 'mock-new-user-token') {
        // Return the last registered user for testing new registration
        const lastUser = users[users.length - 1];
        return res(ctx.status(200), ctx.json({ status: 'success', data: { user: lastUser } }));
    }
    return res(ctx.status(401), ctx.json({ status: 'error', message: 'Unauthorized' }));
  }),

  // Product Handlers
  rest.get(`${API_BASE_URL}/products`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: 'success', data: { products } }));
  }),

  rest.get(`${API_BASE_URL}/products/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    if (product) {
      return res(ctx.status(200), ctx.json({ status: 'success', data: { product } }));
    }
    return res(ctx.status(404), ctx.json({ status: 'error', message: 'Product not found' }));
  }),

  rest.post(`${API_BASE_URL}/products`, (req, res, ctx) => {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) return res(ctx.status(401), ctx.json({ status: 'error', message: 'Unauthorized' }));

    let userId;
    if (token === 'mock-admin-token') userId = 'admin1';
    else if (token === 'mock-user-token') userId = 'user1';
    else if (token === 'mock-new-user-token') userId = users[users.length - 1].id;
    else return res(ctx.status(401), ctx.json({ status: 'error', message: 'Invalid token' }));

    const owner = users.find(u => u.id === userId);
    const newProduct = { id: uuidv4(), userId, owner, ...req.body };
    products.push(newProduct);
    return res(ctx.status(201), ctx.json({ status: 'success', data: { product: newProduct } }));
  }),

  rest.patch(`${API_BASE_URL}/products/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) return res(ctx.status(401), ctx.json({ status: 'error', message: 'Unauthorized' }));

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return res(ctx.status(404), ctx.json({ status: 'error', message: 'Product not found' }));

    let userId;
    let isAdmin = false;
    if (token === 'mock-admin-token') { userId = 'admin1'; isAdmin = true; }
    else if (token === 'mock-user-token') userId = 'user1';
    else if (token === 'mock-new-user-token') userId = users[users.length - 1].id;
    else return res(ctx.status(401), ctx.json({ status: 'error', message: 'Invalid token' }));

    const product = products[productIndex];
    if (product.userId !== userId && !isAdmin) {
      return res(ctx.status(403), ctx.json({ status: 'error', message: 'Forbidden' }));
    }

    products[productIndex] = { ...product, ...req.body };
    return res(ctx.status(200), ctx.json({ status: 'success', data: { product: products[productIndex] } }));
  }),

  rest.delete(`${API_BASE_URL}/products/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) return res(ctx.status(401), ctx.json({ status: 'error', message: 'Unauthorized' }));

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return res(ctx.status(404), ctx.json({ status: 'error', message: 'Product not found' }));

    let userId;
    let isAdmin = false;
    if (token === 'mock-admin-token') { userId = 'admin1'; isAdmin = true; }
    else if (token === 'mock-user-token') userId = 'user1';
    else if (token === 'mock-new-user-token') userId = users[users.length - 1].id;
    else return res(ctx.status(401), ctx.json({ status: 'error', message: 'Invalid token' }));

    const product = products[productIndex];
    if (product.userId !== userId && !isAdmin) {
      return res(ctx.status(403), ctx.json({ status: 'error', message: 'Forbidden' }));
    }

    products = products.filter(p => p.id !== id);
    return res(ctx.status(204));
  }),

  // User Handlers (Admin only)
  rest.get(`${API_BASE_URL}/users`, (req, res, ctx) => {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (token !== 'mock-admin-token') {
      return res(ctx.status(403), ctx.json({ status: 'error', message: 'Forbidden' }));
    }
    return res(ctx.status(200), ctx.json({ status: 'success', data: { users: users.map(({ password, ...rest }) => rest) } }));
  }),

  rest.delete(`${API_BASE_URL}/users/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (token !== 'mock-admin-token') {
      return res(ctx.status(403), ctx.json({ status: 'error', message: 'Forbidden' }));
    }
    // Prevent admin from deleting self in test setup
    if (id === 'admin1') {
      return res(ctx.status(403), ctx.json({ status: 'error', message: 'Cannot delete admin user.' }));
    }

    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length < initialLength) {
      return res(ctx.status(204));
    }
    return res(ctx.status(404), ctx.json({ status: 'error', message: 'User not found' }));
  }),
];