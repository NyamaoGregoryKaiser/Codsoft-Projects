import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPost } from '../api/api';

const PublicPostViewPage = () => {
  const { identifier } = useParams(); // Can be slug or ID
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getPost(identifier);
        setPost(response.data.data);
      } catch (err) {
        console.error('Failed to fetch post:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [identifier]);

  const getFullFileUrl = (filepath) => {
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    return `${apiBase.replace('/api', '')}${filepath}`;
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading post...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  }

  if (!post) {
    return <div className="text-center text-gray-600 mt-10 text-xl">Post not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto my-10 p-6 bg-white rounded-lg shadow-xl">
      {post.featuredImage && (
        <img
          src={getFullFileUrl(post.featuredImage.filepath)}
          alt={post.title}
          className="w-full h-80 object-cover rounded-md mb-6 shadow-md"
        />
      )}
      <h1 className="text-4xl font-extrabold mb-4 text-gray-900">{post.title}</h1>
      <div className="flex items-center text-gray-600 text-sm mb-6 space-x-4">
        <span>By <span className="font-semibold">{post.author.username}</span></span>
        <span>•</span>
        <span>Published on {new Date(post.publishedAt).toLocaleDateString()}</span>
        {post.category && (
          <>
            <span>•</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{post.category.name}</span>
          </>
        )}
      </div>
      <div className="prose lg:prose-lg max-w-none text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }}>
      </div>
      {/* You might want to sanitize HTML content from the backend to prevent XSS */}
    </div>
  );
};

export default PublicPostViewPage;