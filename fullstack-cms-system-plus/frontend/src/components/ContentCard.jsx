```jsx
import React from 'react';

const ContentCard = ({ content }) => {
  const truncatedBody = content.body.length > 150 ? content.body.substring(0, 150) + '...' : content.body;

  return (
    <div className="content-card">
      {content.featuredImage && (
        <img src={content.featuredImage} alt={content.title} />
      )}
      <div className="content-card-body">
        <h3>{content.title}</h3>
        <p>{truncatedBody}</p>
        <div className="content-card-footer">
          <span>Author: {content.authorName || 'N/A'}</span>
          <span>Category: {content.categoryName || 'Uncategorized'}</span>
          <span>Published: {new Date(content.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
```