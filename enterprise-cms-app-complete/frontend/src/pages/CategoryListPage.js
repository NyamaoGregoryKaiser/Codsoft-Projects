import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/api';

const CategoryListPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryDescription, setEditingCategoryDescription] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCategories();
      setCategories(response.data.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    try {
      await createCategory({ name: newCategoryName, description: newCategoryDescription });
      setNewCategoryName('');
      setNewCategoryDescription('');
      fetchCategories();
    } catch (err) {
      console.error('Failed to create category:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create category.');
    }
  };

  const handleEditClick = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryDescription(category.description || '');
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setError('');
    if (!editingCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    try {
      await updateCategory(editingCategoryId, { name: editingCategoryName, description: editingCategoryDescription });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      setEditingCategoryDescription('');
      fetchCategories();
    } catch (err) {
      console.error('Failed to update category:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This will remove it from all associated posts.')) {
      setError('');
      try {
        await deleteCategory(categoryId);
        fetchCategories();
      } catch (err) {
        console.error('Failed to delete category:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading categories...</div>;
  if (error && !editingCategoryId) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Categories</h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New Category</h2>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label htmlFor="newCategoryName" className="block text-gray-700 text-sm font-bold mb-2">Category Name:</label>
            <input
              type="text"
              id="newCategoryName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newCategoryDescription" className="block text-gray-700 text-sm font-bold mb-2">Description (optional):</label>
            <textarea
              id="newCategoryDescription"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Category
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Categories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-600">No categories created yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category.id} className="py-4 flex justify-between items-center">
                {editingCategoryId === category.id ? (
                  <form onSubmit={handleUpdateCategory} className="flex-grow space-y-2">
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      required
                    />
                    <textarea
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={editingCategoryDescription}
                      onChange={(e) => setEditingCategoryDescription(e.target.value)}
                    ></textarea>
                    <div className="flex space-x-2">
                      <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">Save</button>
                      <button type="button" onClick={() => setEditingCategoryId(null)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <p className="text-gray-500 text-sm">{category.description}</p>
                  </div>
                )}
                <div className="flex space-x-2 ml-4">
                  {editingCategoryId !== category.id && (
                    <>
                      <button
                        onClick={() => handleEditClick(category)}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoryListPage;