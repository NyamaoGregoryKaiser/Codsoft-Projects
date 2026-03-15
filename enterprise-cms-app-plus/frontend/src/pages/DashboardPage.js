```javascript
import React, { useEffect, useState } from 'react';
import { getPosts, getPages, getMediaItems } from '../api/content';

function DashboardPage() {
  const [postCount, setPostCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsResponse = await getPosts({ limit: 1, offset: 0 });
        setPostCount(postsResponse.data.count);

        const pagesResponse = await getPages({ limit: 1, offset: 0 });
        setPageCount(pagesResponse.data.count);

        const mediaResponse = await getMediaItems({ limit: 1, offset: 0 });
        setMediaCount(mediaResponse.data.count);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="dashboard-page">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-page error-message">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <h1>CMS Dashboard</h1>
      <p>Welcome to your Content Management System!</p>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Posts</h3>
          <p>{postCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Pages</h3>
          <p>{pageCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Media Items</h3>
          <p>{mediaCount}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={() => alert('Implement "Create New Post" functionality')}>Create New Post</button>
        <button onClick={() => alert('Implement "Manage Media" functionality')}>Manage Media</button>
      </div>

      {/* Placeholder for recent activities or quick links */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <ul>
          <li>User "admin" published a new post "Getting Started with CMS".</li>
          <li>User "editor" updated page "About Us".</li>
          <li>User "admin" uploaded "logo.png".</li>
        </ul>
      </div>
    </div>
  );
}

export default DashboardPage;
```