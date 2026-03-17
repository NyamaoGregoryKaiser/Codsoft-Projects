import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchContentById, createContent, updateContent } from '../api/contentApi';
import { fetchCategories } from '../api/categoryApi';
import { Content, Category, ContentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ContentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated, isAdmin, isEditor } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [isFeatured, setIsFeatured] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!id;

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setError(null);
      try {
        const categoriesResponse = await fetchCategories(1, 100); // Fetch all categories for selection
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        } else {
          setError(categoriesResponse.message || 'Failed to fetch categories.');
          return;
        }

        if (isEditMode) {
          const contentResponse = await fetchContentById(id!);
          if (contentResponse.success) {
            const content = contentResponse.data;
            if (content.author.id !== user?.id && !isAdmin && !isEditor) {
                // Not author and not admin/editor - unauthorized access
                setError("You are not authorized to edit this content.");
                setLoading(false);
                return;
            }
            setTitle(content.title);
            setBody(content.body);
            setCategoryId(content.category?.id || '');
            setThumbnailUrl(content.thumbnailUrl || '');
            setStatus(content.status);
            setIsFeatured(content.isFeatured);
          } else {
            setError(contentResponse.message || 'Failed to fetch content.');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if ((isAuthenticated && user) || (!isAuthenticated && !authLoading && (!isEditMode || isEditMode))) {
        // If user is authenticated or it's a new post attempt, proceed
        // Also if it's an edit and not authenticated, loadData will handle redirect or error
        loadData();
    }
  }, [id, isEditMode, navigate, isAuthenticated, user, authLoading, isAdmin, isEditor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError("You must be logged in to create or update content.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isEditMode) {
        await updateContent(id!, { title, body, categoryId, thumbnailUrl, status, isFeatured });
      } else {
        await createContent({ title, body, categoryId, thumbnailUrl, status, isFeatured });
      }
      navigate('/content');
    } catch (err: any) {
      setError(err.response?.data?.message || (err.response?.data?.data ? err.response.data.data.join(', ') : err.message) || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="container py-8 text-center">Loading form...</div>;
  }

  if (error) {
    return <div className="container py-8 text-center text-red-600">Error: {error}</div>;
  }

  // Ensure only authorized users can view/edit
  if (!isAuthenticated || (!isEditor && !isAdmin)) {
    return <div className="container py-8 text-center text-red-600">You are not authorized to access this page.</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{isEditMode ? 'Edit Content' : 'Create New Content'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">Content Body</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={10}
            className="input-field mt-1"
          ></textarea>
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="input-field mt-1"
          >
            <option value="">Select a Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700">Thumbnail URL (Optional)</label>
          <input
            type="text"
            id="thumbnailUrl"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentStatus)}
            className="input-field mt-1"
          >
            {Object.values(ContentStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="isFeatured"
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isFeatured" className="ml-2 block text-sm font-medium text-gray-900">
            Feature this content?
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Content' : 'Create Content')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentFormPage;