import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Posts = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editingPost, setEditingPost] = useState(null); // Post being edited

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (err) {
      setError('Failed to fetch posts.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPostChange = (e) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

  const handleEditPostChange = (e) => {
    setEditingPost({ ...editingPost, [e.target.name]: e.target.value });
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/posts', newPost);
      setNewPost({ title: '', content: '' });
      fetchPosts(); // Refresh posts list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post.');
      console.error('Error creating post:', err);
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/posts/${editingPost.id}`, { title: editingPost.title, content: editingPost.content });
      setEditingPost(null);
      fetchPosts(); // Refresh posts list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post.');
      console.error('Error updating post:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts(); // Refresh posts list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post.');
      console.error('Error deleting post:', err);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-screen text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Posts</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {isAuthenticated && user?.role?.name === 'User' && ( // Only regular users can create posts, admin can also implicitly
          <div className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={newPost.title}
                  onChange={handleNewPostChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  required
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  name="content"
                  id="content"
                  value={newPost.content}
                  onChange={handleNewPostChange}
                  rows="4"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Publish Post
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length === 0 ? (
            <p className="col-span-full text-center text-gray-600">No posts available.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col">
                {editingPost?.id === post.id ? (
                  <form onSubmit={handleUpdatePost} className="space-y-3">
                    <input
                      type="text"
                      name="title"
                      value={editingPost.title}
                      onChange={handleEditPostChange}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 text-lg font-semibold"
                      required
                    />
                    <textarea
                      name="content"
                      value={editingPost.content}
                      onChange={handleEditPostChange}
                      rows="4"
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700"
                      required
                    ></textarea>
                    <div className="flex space-x-2 mt-4">
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                      <button type="button" onClick={() => setEditingPost(null)} className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                    <p className="text-gray-700 text-sm mb-4 flex-grow">{post.content}</p>
                    <p className="text-gray-500 text-xs mt-auto">
                      By {post.author_username || 'Unknown'} on {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    {isAuthenticated && (user?.id === post.user_id || user?.role?.name === 'Admin') && (
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Posts;
```