import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import noteService from '../services/note.service';
import { useAuth } from '../context/AuthContext';
import './NotesListPage.css';

const NotesListPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth(); // To check current user for delete permission (backend also validates)

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await noteService.getMyNotes();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteService.deleteNote(noteId);
        alert('Note deleted successfully!');
        fetchNotes(); // Re-fetch notes to update the list
      } catch (err) {
        console.error('Error deleting note:', err);
        setError(err.message || 'Failed to delete note.');
      }
    }
  };

  if (loading) {
    return <div className="notes-list-container">Loading notes...</div>;
  }

  if (error) {
    return <div className="notes-list-container error-message">{error}</div>;
  }

  return (
    <div className="notes-list-container">
      <h2>My Notes</h2>
      <Link to="/notes/create" className="create-note-button">Create New Note</Link>

      {notes.length === 0 ? (
        <p>You haven't created any notes yet.</p>
      ) : (
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id} className="note-item">
              <div className="note-content">
                <h3><Link to={`/notes/${note.id}`}>{note.title}</Link></h3>
                <p>{note.content.substring(0, 150)}...</p>
                <div className="note-meta">
                  <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                  <span>Last Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="note-actions">
                <Link to={`/notes/edit/${note.id}`} className="action-button edit-button">Edit</Link>
                <button onClick={() => handleDelete(note.id)} className="action-button delete-button">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotesListPage;