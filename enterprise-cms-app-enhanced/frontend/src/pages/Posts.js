import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './CrudPage.css'; // Generic CRUD page styling

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', categoryId: '', status: 'draft' });
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState('');
  const { hasRole, user } = useAuth();

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (err) {
      setError('Failed to fetch posts.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to fetch categories.');
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingPost) {
      setEditingPost({ ...editingPost, [name]: value });
    } else {
      setNewPost({ ...newPost, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingPost) {
        await api.patch(`/posts/${editingPost.id}`, editingPost);
        setEditingPost(null);
      } else {
        await api.post('/posts', newPost);
        setNewPost({ title: '', content: '', categoryId: '', status: 'draft' });
      }
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save post.');
    }
  };

  const handleDelete = async (postId) => {
    setError('');
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${postId}`);
        fetchPosts();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete post.');
      }
    }
  };

  const startEdit = (post) => {
    setEditingPost({ ...post, categoryId: post.category?.id || '' });
    setNewPost({ title: '', content: '', categoryId: '', status: 'draft' }); // Clear new post form
  };

  const cancelEdit = () => {
    setEditingPost(null);
  };

  const canEditOrDelete = (post) => {
    return hasRole('admin') || (hasRole('editor') && post.authorId === user.id) || (hasRole('user') && post.authorId === user.id);
  }

  return (
    <div className="crud-container">
      <h2>Posts Management</h2>
      {error && <p className="error-message">{error}</p>}

      {(hasRole('admin') || hasRole('editor')) && (
        <div className="crud-form">
          <h3>{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={editingPost ? editingPost.title : newPost.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Content:</label>
              <textarea
                name="content"
                value={editingPost ? editingPost.content : newPost.content}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select
                name="categoryId"
                value={editingPost ? editingPost.categoryId : newPost.categoryId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                name="status"
                value={editingPost ? editingPost.status : newPost.status}
                onChange={handleInputChange}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button type="submit" className="action-button primary">
              {editingPost ? 'Update Post' : 'Create Post'}
            </button>
            {editingPost && (
              <button type="button" onClick={cancelEdit} className="action-button secondary">
                Cancel
              </button>
            )}
          </form>
        </div>
      )}

      <div className="crud-list">
        <h3>All Posts</h3>
        {posts.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.content.substring(0, 100)}...</p>
                  <small>Author: {post.author?.name} | Category: {post.category?.name} | Status: {post.status}</small>
                  {post.featuredImage && <img src={post.featuredImage.filePath} alt="Featured" style={{width: '100px', height: 'auto', marginLeft: '10px'}} />}
                </div>
                {(canEditOrDelete(post)) && (
                  <div className="actions">
                    <button onClick={() => startEdit(post)} className="action-button edit">Edit</button>
                    {(hasRole('admin') || post.authorId === user.id) && ( // Author or Admin can delete
                      <button onClick={() => handleDelete(post.id)} className="action-button delete">Delete</button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Posts;