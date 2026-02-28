```jsx
import React, { useEffect, useState } from 'react';
import { getPublishedContent } from '../api/content';
import ContentCard from '../components/ContentCard';

const HomePage = () => {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublishedContent(page, 9, 'publishedAt'); // Fetch 9 items per page
        setContentList(data.content);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError('Failed to load content.');
        console.error("Error fetching published content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [page]);

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    setPage((prev) => prev - 1);
  };

  if (loading) return <div>Loading content...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <h1>Latest Published Content</h1>
      {contentList.length === 0 ? (
        <p>No published content available yet.</p>
      ) : (
        <>
          <div className="content-list">
            {contentList.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
          <div className="pagination">
            <button onClick={handlePreviousPage} disabled={page === 0}>
              Previous
            </button>
            <span>Page {page + 1} of {totalPages}</span>
            <button onClick={handleNextPage} disabled={page >= totalPages - 1}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
```