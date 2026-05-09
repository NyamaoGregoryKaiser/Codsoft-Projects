```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as postApi from '../api/post';
import useAuth from '../hooks/useAuth';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await postApi.getPostById(id);
        setPost(data);
      } catch (err) {
        setError(err.detail || 'Failed to fetch post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postApi.deletePost(id);
        navigate('/'); // Go back to dashboard after deleting
      } catch (err) {
        setError(err.detail || 'Failed to delete post.');
      }
    }
  };

  if (loading) {
    return <div className="container">Loading post...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  if (!post) {
    return <div className="container">Post not found.</div>;
  }

  const isOwner = user?.id === post.owner_id;
  const isAdmin = user?.is_admin;

  return (
    <div className="container">
      <h2>{post.title}</h2>
      <p>By: {post.owner.first_name || post.owner.email} on {new Date(post.created_at).toLocaleDateString()}</p>
      <div className="post-content" style={{ whiteSpace: 'pre-wrap' }}>
        {post.content}
      </div>

      {(isOwner || isAdmin) && (
        <div className="post-actions">
          {isOwner && <Link to={`/posts/edit/${post.id}`} className="button">Edit Post</Link>}
          <button onClick={handleDelete} className="button delete-button">Delete Post</button>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="button" style={{ marginTop: '20px', backgroundColor: '#6c757d' }}>Back to Dashboard</button>
    </div>
  );
};

export default PostDetailPage;
```