import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost } from '../api/api';
import AuthContext from '../utils/AuthContext';

const PostListPage = ({ managementView = false }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      // If in management view and user is logged in, show their drafts if they are an author/editor/admin
      if (managementView && user && ['admin', 'editor', 'author'].includes(user.role)) {
        // You might send a specific query param like `include_drafts=true` to the backend
        // or the backend itself handles this based on auth token.
        // Our backend's getAllPosts already takes care of this via `includeDrafts` parameter
        // which is set by the controller based on user role.
        // For author, also filter by their ID
        if (user.role === 'author') {
            params.authorId = user.id;
        }
      } else {
        // For public view, only fetch published posts (handled by backend by default)
      }

      const response = await getPosts(params);
      setPosts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch posts:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [managementView, user]); // Re-fetch if view changes or user changes

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
        fetchPosts(); // Refresh list after deletion
      } catch (err) {
        console.error('Failed to delete post:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to delete post.');
      }
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {managementView ? 'Manage Posts' : 'Latest Posts'}
        </h1>
        {managementView && ['admin', 'editor', 'author'].includes(user?.role) && (
          <Link to="/admin/posts/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Create New Post
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-600">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
              <div>
                <Link to={managementView ? `/admin/posts/edit/${post.id}` : `/posts/${post.slug}`} className="block">
                  <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-800">{post.title}</h2>
                </Link>
                <p className="text-gray-600 text-sm mb-2">By {post.author.username} on {new Date(post.createdAt).toLocaleDateString()}</p>
                {post.category && (
                  <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                    {post.category.name}
                  </span>
                )}
                {managementView && (
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2 ${
                    post.status === 'published' ? 'bg-green-200 text-green-800' :
                    post.status === 'draft' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {post.status.toUpperCase()}
                  </span>
                )}
                <p className="text-gray-700 mt-2 line-clamp-3">{post.content.substring(0, 150)}...</p>
              </div>
              {managementView && (user?.role === 'admin' || user?.role === 'editor' || (user?.role === 'author' && user?.id === post.authorId)) && (
                <div className="mt-4 flex space-x-2">
                  <Link to={`/admin/posts/edit/${post.id}`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostListPage;