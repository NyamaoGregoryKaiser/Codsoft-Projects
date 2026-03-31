import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import noteService from '../services/note.service';
import './NoteDetailPage.css';

const NoteDetailPage = () => {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const fetchedNote = await noteService.getNoteById(id);
        setNote(fetchedNote);
      } catch (err) {
        console.error('Error fetching note:', err);
        setError(err.message || 'Failed to load note details.');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  if (loading) {
    return <div className="note-detail-container">Loading note details...</div>;
  }

  if (error) {
    return <div className="note-detail-container error-message">{error}</div>;
  }

  if (!note) {
    return <div className="note-detail-container">Note not found.</div>;
  }

  return (
    <div className="note-detail-container">
      <h2>{note.title}</h2>
      <p className="note-detail-meta">
        <strong>Owner:</strong> {note.username} (ID: {note.userId}) <br />
        <strong>Created At:</strong> {new Date(note.createdAt).toLocaleString()} <br />
        <strong>Last Updated:</strong> {new Date(note.updatedAt).toLocaleString()}
      </p>
      <div className="note-detail-content">
        <p>{note.content}</p>
      </div>
      <div className="note-detail-actions">
        <Link to={`/notes/edit/${note.id}`} className="action-button">Edit Note</Link>
        <Link to="/notes" className="action-button secondary-button">Back to Notes</Link>
      </div>
    </div>
  );
};

export default NoteDetailPage;