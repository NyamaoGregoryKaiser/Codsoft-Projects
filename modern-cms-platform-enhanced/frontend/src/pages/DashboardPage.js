```javascript
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllPosts, deletePost } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      setError('Failed to fetch posts for dashboard.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
        await fetchPosts(); // Refresh list after deletion
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete post.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="dashboard-nav">
        {hasRole(['admin', 'author']) && (
          <Link to="/dashboard/posts/new">Create New Post</Link>
        )}
        {hasRole(['admin']) && (
          <>
            <Link to="/dashboard/users">Manage Users</Link>
            <Link to="/dashboard/taxonomy">Manage Categories & Tags</Link>
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Your Posts</h2>
        {posts.length > 0 ? (
          <div className="dashboard-list">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Published At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td>{post.author?.username || 'N/A'}</td>
                    <td>{post.category?.name || 'N/A'}</td>
                    <td>{post.status}</td>
                    <td>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="actions">
                      {hasRole(['admin', 'author']) && (user.id === post.authorId || hasRole(['admin'])) && (
                        <>
                          <Link to={`/dashboard/posts/edit/${post.id}`} className="btn-edit btn-small">Edit</Link>
                          <button onClick={() => handleDelete(post.id)} className="btn-delete btn-small">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No posts found.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
```