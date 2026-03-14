```javascript
/**
 * @file Displays a list of users in the application.
 * @module components/UserList
 */

import React, { useState, useEffect } from 'react';
import './UserList.css';
import { getAllUsers } from '../api/authApi';
import useAuth from '../hooks/useAuth';

const UserList = () => {
    const { socket } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch all users:', err);
            setError(err.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();

        if (socket) {
            socket.on('user:status:update', (data) => {
                // console.log('User status update received:', data);
                setUsers(prevUsers => prevUsers.map(user =>
                    user.id === data.userId ? { ...user, status: data.status } : user
                ));
            });

            return () => {
                socket.off('user:status:update');
            };
        }
    }, [socket]);


    if (loading) {
        return <div className="user-list-container">Loading users...</div>;
    }

    if (error) {
        return <div className="user-list-container error-message">{error}</div>;
    }

    return (
        <div className="user-list-container">
            <h3>All Users</h3>
            <ul className="user-list">
                {users.length === 0 && <p className="no-users">No users registered.</p>}
                {users.map((user) => (
                    <li key={user.id} className="user-item">
                        <span className={`user-status-indicator ${user.status}`}></span>
                        <span className="username">{user.username}</span>
                        <span className="user-status">{user.status}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserList;
```