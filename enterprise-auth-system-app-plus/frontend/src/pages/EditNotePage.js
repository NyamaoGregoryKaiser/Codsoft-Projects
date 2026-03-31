import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import noteService from '../services/note.service';
import './NoteFormPage.css';

const EditNotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const fetchedNote = await noteService.getNoteById(id);
        setTitle(fetchedNote.title);
        setContent(fetchedNote.content);
      } catch (err) {
        console.error('Error fetching note for edit:', err);
        setError(err.message || 'Failed to load note for editing.');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const updatedNote = { title, content };
      await noteService.updateNote(id, updatedNote);
      alert('Note updated successfully!');
      navigate('/notes'); // Redirect to notes list
    } catch (err) {
      console.error('Error updating note:', err);
      if (err.title || err.content) {
        let validationErrors = [];
        if (err.title) validationErrors.push(`Title: ${err.title}`);
        if (err.content) validationErrors.push(`Content: ${err.content}`);
        setError(validationErrors.join(', '));
      } else {
        setError(err.message || 'Failed to update note.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="note-form-container">Loading note for editing...</div>;
  }

  if (error) {
    return <div className="note-form-container error-message">{error}</div>;
  }

  return (
    <div className="note-form-container">
      <h2>Edit Note</h2>
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
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditNotePage;