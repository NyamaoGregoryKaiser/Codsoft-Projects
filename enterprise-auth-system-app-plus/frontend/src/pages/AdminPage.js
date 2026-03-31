import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import noteService from '../services/note.service';
import './AdminPage.css';

const AdminPage = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');
  const [errorNotes, setErrorNotes] = useState('');

  const isAdmin = user && user.roles.includes('ROLE_ADMIN');

  useEffect(() => {
    if (!isAdmin) {
      setErrorUsers('Access Denied: You are not an administrator.');
      setErrorNotes('Access Denied: You are not an administrator.');
      setLoadingUsers(false);
      setLoadingNotes(false);
      return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersData = await userService.getAllUsers();
        setAllUsers(usersData);
      } catch (err) {
        console.error('Error fetching all users:', err);
        setErrorUsers(err.message || 'Failed to load users.');
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        const notesData = await noteService.getAllNotes();
        setAllNotes(notesData);
      } catch (err) {
        console.error('Error fetching all notes:', err);
        setErrorNotes(err.message || 'Failed to load notes.');
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchUsers();
    fetchNotes();
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="admin-container error-message">Access Denied: You do not have administrative privileges.</div>;
  }

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>

      <section className="admin-section">
        <h3>All Users</h3>
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : errorUsers ? (
          <p className="error-message">{errorUsers}</p>
        ) : allUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.roles.join(', ')}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-section">
        <h3>All Notes</h3>
        {loadingNotes ? (
          <p>Loading notes...</p>
        ) : errorNotes ? (
          <p className="error-message">{errorNotes}</p>
        ) : allNotes.length === 0 ? (
          <p>No notes found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Content (excerpt)</th>
                <th>Owner</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {allNotes.map((note) => (
                <tr key={note.id}>
                  <td>{note.id}</td>
                  <td>{note.title}</td>
                  <td>{note.content.substring(0, 50)}...</td>
                  <td>{note.username} (ID: {note.userId})</td>
                  <td>{new Date(note.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminPage;