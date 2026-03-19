```javascript
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPost, deletePost } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function PostDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, hasRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const defaultImage = 'https://via.placeholder.com/800x400?text=No+Featured+Image';
  const featuredImage = post?.featuredImage ? `${process.env.REACT_APP_API_BASE_URL}${post.featuredImage}` : defaultImage;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPost(slug);
        setPost(data);
      } catch (err) {
        setError('Failed to fetch post or post not found.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post.id);
        navigate('/dashboard'); // Redirect to dashboard after deletion
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete post.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div>Loading post...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!post) {
    return <div className="error-message">Post not found.</div>;
  }

  const canManagePost = isAuthenticated && hasRole(['admin', 'author']) &&
                        (user.id === post.authorId || hasRole(['admin']));

  return (
    <div className="post-detail">
      <h1>{post.title}</h1>
      <div className="post-detail-meta">
        <span>By {post.author.username}</span>
        <span>| Category: {post.category ? post.category.name : 'Uncategorized'}</span>
        <span>| Published on: {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}</span>
        {post.status !== 'published' && <span style={{color: 'red'}}>| Status: {post.status.toUpperCase()}</span>}
      </div>
      {featuredImage !== defaultImage && (
        <img src={featuredImage} alt={post.title} className="featured-image-preview" />
      )}
      <div className="post-detail-content" dangerouslySetInnerHTML={{ __html: post.content }}></div>

      {post.tags && post.tags.length > 0 && (
        <div style={{marginTop: '20px'}}>
          <strong>Tags:</strong>
          {post.tags.map(tag => (
            <span key={tag.id} className="tag" style={{marginLeft: '10px'}}>{tag.name}</span>
          ))}
        </div>
      )}

      {canManagePost && (
        <div className="action-buttons">
          <Link to={`/dashboard/posts/edit/${post.id}`} className="btn-edit">Edit Post</Link>
          <button onClick={handleDelete} className="btn-delete">Delete Post</button>
        </div>
      )}
    </div>
  );
}

export default PostDetailPage;
```