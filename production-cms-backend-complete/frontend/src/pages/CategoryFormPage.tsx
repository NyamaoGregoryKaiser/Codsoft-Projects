import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCategoryById, createCategory, updateCategory } from '../api/categoryApi';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const CategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isEditor, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!id;

  useEffect(() => {
    // Only Admins or Editors can access this form
    if (!authLoading && !isAdmin && !isEditor) {
      navigate('/unauthorized'); // Redirect to unauthorized page
      return;
    }

    const loadCategory = async () => {
      if (isEditMode) {
        setLoading(true);
        setError(null);
        try {
          const response = await fetchCategoryById(id!);
          if (response.success) {
            setName(response.data.name);
            setDescription(response.data.description || '');
          } else {
            setError(response.message || 'Failed to fetch category.');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // For new category, no loading
      }
    };

    if (!authLoading && (isAdmin || isEditor)) { // Ensure auth check passes before loading data
        loadCategory();
    }
  }, [id, isEditMode, navigate, isAdmin, isEditor, authLoading]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditMode) {
        await updateCategory(id!, { name, description });
      } else {
        await createCategory({ name, description });
      }
      navigate('/categories');
    } catch (err: any) {
      setError(err.response?.data?.message || (err.response?.data?.data ? err.response.data.data.join(', ') : err.message) || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="container py-8 text-center">Loading form...</div>;
  }

  // Double-check authorization after loading
  if (!isAdmin && !isEditor) {
    return <div className="container py-8 text-center text-red-600">You are not authorized to access this page.</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{isEditMode ? 'Edit Category' : 'Create New Category'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input-field mt-1"
          ></textarea>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Category' : 'Create Category')}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      </form>
    </div>
  );
};

export default CategoryFormPage;