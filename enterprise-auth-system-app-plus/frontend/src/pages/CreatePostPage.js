```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as postApi from '../api/post';

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postApi.createPost({ title, content });
      navigate('/'); // Go back to dashboard after creating
    } catch (err) {
      setError(err.detail || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Create New Post</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
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
          <label htmlFor="content">Content:</label>
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
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="button" style={{ marginLeft: '10px', backgroundColor: '#6c757d' }} disabled={loading}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreatePostPage;
```