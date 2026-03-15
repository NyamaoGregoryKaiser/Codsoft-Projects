```javascript
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getPosts, getPages, getCategories, getTags } from '../api/content';

// A generic list page for different content types (Posts, Pages, Categories, Tags)
function ContentListPage({ contentType }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  const fetchItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      let response;
      switch (contentType) {
        case 'posts':
          response = await getPosts();
          break;
        case 'pages':
          response = await getPages();
          break;
        case 'categories':
          response = await getCategories();
          break;
        case 'tags':
          response = await getTags();
          break;
        default:
          throw new Error('Invalid content type');
      }
      setItems(response.data.results || response.data); // DRF pagination vs non-pagination
    } catch (err) {
      console.error(`Error fetching ${contentType}:`, err.response?.data || err.message);
      setError(`Failed to load ${contentType}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [contentType, location.key]); // Refetch when content type or location changes

  if (isLoading) {
    return <div className="content-list-page">Loading {contentType}...</div>;
  }

  if (error) {
    return <div className="content-list-page error-message">{error}</div>;
  }

  const renderItem = (item) => {
    switch (contentType) {
      case 'posts':
        return (
          <li key={item.id}>
            <Link to={`/posts/${item.slug}`}>{item.title} ({item.status})</Link>
            <span> by {item.author?.username || 'N/A'}</span>
          </li>
        );
      case 'pages':
        return (
          <li key={item.id}>
            <Link to={`/pages/${item.slug}`}>{item.title} ({item.is_published ? 'Published' : 'Draft'})</Link>
            <span> by {item.author?.username || 'N/A'}</span>
          </li>
        );
      case 'categories':
      case 'tags':
        return (
          <li key={item.id}>
            <Link to={`/${contentType}/${item.slug}`}>{item.name}</Link>
          </li>
        );
      default:
        return null;
    }
  };

  return (
    <div className="content-list-page">
      <h1>{contentType.charAt(0).toUpperCase() + contentType.slice(1)} List</h1>
      <Link to={`/${contentType}/new`} className="button new-item-button">Create New {contentType.slice(0, -1)}</Link>
      {items.length === 0 ? (
        <p>No {contentType} found.</p>
      ) : (
        <ul>
          {items.map(renderItem)}
        </ul>
      )}
    </div>
  );
}

export default ContentListPage;
```