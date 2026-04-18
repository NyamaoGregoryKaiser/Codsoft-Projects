import React, { useEffect, useState } from 'react';
import { Content } from '../types';
import { getPublishedContent } from '../api/content.api';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getPublishedContent();
        setContent(data);
      } catch (err) {
        setError('Failed to fetch content.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading content...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Latest Articles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.length > 0 ? (
          content.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                <Link to={`/content/${item.slug}`} className="hover:text-indigo-600 transition-colors">
                  {item.title}
                </Link>
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                By {item.author.firstName} {item.author.lastName} on {new Date(item.publishedAt!).toLocaleDateString()}
              </p>
              {item.category && (
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full mb-3">
                  {item.category.name}
                </span>
              )}
              <p className="text-gray-700 leading-relaxed mb-4">
                {item.body.substring(0, 150)}...
              </p>
              <Link to={`/content/${item.slug}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                Read More
              </Link>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No content published yet.</p>
        )}
      </div>
    </div>
  );
};