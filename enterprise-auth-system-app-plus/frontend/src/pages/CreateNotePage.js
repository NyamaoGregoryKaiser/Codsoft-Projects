import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService from '../services/note.service';
import { useAuth } from '../context/AuthContext';
import './NoteFormPage.css';

const CreateNotePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user || !user.id) {
        setError('User not authenticated. Please login.');
        setLoading(false);
        return;
    }

    try {
      const newNote = {
        title,
        content,
        userId: user.id, // Associate note with the current user
      };
      await noteService.createNote(newNote);
      alert('Note created successfully!');
      navigate('/notes'); // Redirect to notes list
    } catch (err) {
      console.error('Error creating note:', err);
      if (err.title || err.content || err.userId) {
        let validationErrors = [];
        if (err.title) validationErrors.push(`Title: ${err.title}`);
        if (err.content) validationErrors.push(`Content: ${err.content}`);
        if (err.userId) validationErrors.push(`User ID: ${err.userId}`);
        setError(validationErrors.join(', '));
      } else {
        setError(err.message || 'Failed to create note.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-form-container">
      <h2>Create New Note</h2>
      <form onSubmit={handleSubmit} className="note-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows="10"
            disabled={loading}
          ></textarea>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </form>
    </div>
  );
};

export default CreateNotePage;