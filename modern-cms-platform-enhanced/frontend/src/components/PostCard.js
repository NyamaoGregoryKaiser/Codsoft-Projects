```javascript
import React from 'react';
import { Link } from 'react-router-dom';

function PostCard({ post }) {
  const defaultImage = 'https://via.placeholder.com/400x200?text=No+Image'; // Placeholder for posts without images
  const featuredImage = post.featuredImage ? `${process.env.REACT_APP_API_BASE_URL}${post.featuredImage}` : defaultImage;

  return (
    <div className="post-card">
      <img src={featuredImage} alt={post.title} className="post-card-image" />
      <div className="post-card-content">
        <h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <div className="post-card-meta">
          <span>By {post.author.username}</span>
          <span>In {post.category ? post.category.name : 'Uncategorized'}</span>
          {post.tags && post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map(tag => (
                <span key={tag.id} className="tag">{tag.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostCard;
```