```javascript
/**
 * @file Utility functions for interacting with localStorage.
 * @module utils/localStorage
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Stores the JWT token in localStorage.
 * @param {string} token - The JWT token to store.
 */
export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Retrieves the JWT token from localStorage.
 * @returns {string|null} The stored JWT token or null if not found.
 */
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Removes the JWT token from localStorage.
 */
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    removeUserFromLocalStorage(); // Also remove user data when token is removed
};

/**
 * Stores user data (non-sensitive) in localStorage.
 * @param {object} user - The user object to store.
 */
export const setUserInLocalStorage = (user) => {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_KEY);
    }
};

/**
 * Retrieves user data from localStorage.
 * @returns {object|null} The stored user object or null if not found/parse error.
 */
export const getUserFromLocalStorage = () => {
    try {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        return null;
    }
};

/**
 * Removes user data from localStorage.
 */
export const removeUserFromLocalStorage = () => {
    localStorage.removeItem(USER_KEY);
};
```