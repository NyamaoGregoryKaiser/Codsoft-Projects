```javascript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as postApi from '../api/post';
import useAuth from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postApi.getAllPosts();
        setPosts(data);
      } catch (err) {
        setError(err.detail || 'Failed to fetch posts.');
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postApi.deletePost(postId);
        setPosts(posts.filter(post => post.id !== postId));
      } catch (err) {
        setError(err.detail || 'Failed to delete post.');
      }
    }
  };

  if (loadingPosts) {
    return <div className="container">Loading posts...</div>;
  }

  return (
    <div className="container">
      <h2>Dashboard</h2>
      <p>Welcome, {user?.first_name || user?.email}!</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Latest Posts</h3>
        <Link to="/posts/create" className="button">Create New Post</Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      {posts.length === 0 ? (
        <p>No posts available. Be the first to create one!</p>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="card">
              <h3><Link to={`/posts/${post.id}`}>{post.title}</Link></h3>
              <p>By: {post.owner.first_name || post.owner.email} on {new Date(post.created_at).toLocaleDateString()}</p>
              <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
              
              {(user?.id === post.owner_id || user?.is_admin) && (
                <div className="post-actions">
                  <Link to={`/posts/edit/${post.id}`} className="button">Edit</Link>
                  <button onClick={() => handleDelete(post.id)} className="button delete-button">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
```