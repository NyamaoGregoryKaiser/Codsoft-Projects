```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as postApi from '../api/post';
import useAuth from '../hooks/useAuth';

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postOwnerId, setPostOwnerId] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await postApi.getPostById(id);
        setTitle(data.title);
        setContent(data.content);
        setPostOwnerId(data.owner_id);
      } catch (err) {
        setError(err.detail || 'Failed to fetch post for editing.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!loading && postOwnerId !== null && user?.id !== postOwnerId) {
      // If post is loaded and current user is not the owner, redirect
      setError("You are not authorized to edit this post.");
      navigate(`/posts/${id}`, { replace: true });
    }
  }, [loading, postOwnerId, user, id, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Re-use loading state for form submission
    try {
      await postApi.updatePost(id, { title, content });
      navigate(`/posts/${id}`); // Go back to post detail after updating
    } catch (err) {
      setError(err.detail || 'Failed to update post.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading post for editing...</div>;
  }

  if (error && user?.id !== postOwnerId) {
      return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h2>Edit Post</h2>
      {error && <p className="error-message">{error}</p>}
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
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Updating...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="button" style={{ marginLeft: '10px', backgroundColor: '#6c757d' }} disabled={loading}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditPostPage;
```