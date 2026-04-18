import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Content } from '../types';
import { getPublishedContentByIdOrSlug } from '../api/content.api';

export const ContentDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) {
      setError('Content ID or slug is missing.');
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const data = await getPublishedContentByIdOrSlug(idOrSlug);
        setContent(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Content not found or not published.');
        } else {
          setError('Failed to fetch content.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [idOrSlug]);

  if (loading) return <div className="text-center mt-8">Loading content...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
  if (!content) return <div className="text-center mt-8 text-gray-500">Content not available.</div>;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <article className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{content.title}</h1>
        <div className="flex items-center text-gray-600 text-sm mb-6 space-x-4">
          <span>By {content.author.firstName} {content.author.lastName}</span>
          {content.publishedAt && (
            <span>Published on {new Date(content.publishedAt).toLocaleDateString()}</span>
          )}
          {content.category && (
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
              {content.category.name}
            </span>
          )}
        </div>
        <div className="prose prose-indigo max-w-none text-gray-800 leading-relaxed mb-8">
          <p>{content.body}</p> {/* In a real CMS, this would be rendered from rich text/markdown */}
        </div>
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {content.tags.map(tag => (
              <span key={tag.id} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};