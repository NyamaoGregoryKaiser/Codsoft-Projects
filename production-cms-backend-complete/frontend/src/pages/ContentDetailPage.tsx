import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchContentById, deleteContent } from '../api/contentApi';
import { Content, ContentStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, user, isEditor, isAdmin } = useAuth();

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchContentById(id!);
        if (response.success) {
          setContent(response.data);
        } else {
          setError(response.message || 'Failed to fetch content details.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadContent();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!isAuthenticated || (!isAdmin && !isEditor && user?.id !== content?.author.id)) {
        alert("You are not authorized to delete this content.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      try {
        await deleteContent(id!);
        navigate('/content');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to delete content.');
      }
    }
  };

  if (loading) {
    return <div className="container py-8 text-center">Loading content...</div>;
  }

  if (error) {
    return <div className="container py-8 text-center text-red-600">Error: {error}</div>;
  }

  if (!content) {
    return <div className="container py-8 text-center text-gray-500">Content not found.</div>;
  }

  const isAuthor = user?.id === content.author.id;
  const canEditOrDelete = isAuthor || isEditor || isAdmin;

  return (
    <div className="container py-8">
      <article className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{content.title}</h1>
        <div className="flex items-center text-gray-600 text-sm mb-6 space-x-4">
          <span>By <span className="font-semibold">{content.author?.email || 'Unknown'}</span></span>
          <span>In <Link to={`/categories/${content.category?.id}`} className="font-semibold text-indigo-600 hover:underline">{content.category?.name || 'Uncategorized'}</Link></span>
          <span>Published on {new Date(content.createdAt).toLocaleDateString()}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold
            ${content.status === ContentStatus.PUBLISHED ? 'bg-green-100 text-green-800' :
              content.status === ContentStatus.DRAFT ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {content.status}
          </span>
          {content.isFeatured && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Featured</span>}
        </div>

        {content.thumbnailUrl && (
          <img src={content.thumbnailUrl} alt={content.title} className="w-full h-80 object-cover rounded-lg mb-8" />
        )}

        <div className="prose prose-lg max-w-none mb-8 text-gray-800">
          <p>{content.body}</p> {/* In a real CMS, this would be dangerouslySetInnerHTML or a markdown renderer */}
        </div>

        {canEditOrDelete && (
          <div className="mt-8 flex space-x-4">
            <Link to={`/content/edit/${content.id}`} className="btn btn-primary">
              Edit Content
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Content
            </button>
          </div>
        )}
      </article>
    </div>
  );
};

export default ContentDetailPage;