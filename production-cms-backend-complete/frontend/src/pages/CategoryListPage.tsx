import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, deleteCategory } from '../api/categoryApi';
import { Category, PaginationMeta, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';

const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  const { isAdmin, isEditor } = useAuth();

  useEffect(() => {
    if (!isAdmin && !isEditor) return; // Only Admins/Editors can access this page
    loadCategories(currentPage);
  }, [currentPage, isAdmin, isEditor]);

  const loadCategories = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCategories(page, 10);
      if (response.success) {
        setCategories(response.data);
        if (response.meta) {
          setMeta(response.meta);
        }
      } else {
        setError(response.message || 'Failed to fetch categories.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? All associated content might be affected.')) {
      try {
        await deleteCategory(id);
        loadCategories(currentPage); // Reload categories
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to delete category.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isAdmin && !isEditor) {
    return <div className="container py-8 text-center text-red-600">You are not authorized to view this page.</div>;
  }

  if (loading) {
    return <div className="container py-8 text-center">Loading categories...</div>;
  }

  if (error) {
    return <div className="container py-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <Link to="/categories/new" className="btn btn-primary">
          Create New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-gray-500">No categories found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Description</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">
                      <Link to={`/categories/${category.id}`} className="text-indigo-600 hover:underline">
                        {category.name}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b">{category.description || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <Link to={`/categories/edit/${category.id}`} className="text-blue-600 hover:text-blue-800 mr-2">
                        Edit
                      </Link>
                      {isAdmin && ( // Only Admin can delete categories
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default CategoryListPage;