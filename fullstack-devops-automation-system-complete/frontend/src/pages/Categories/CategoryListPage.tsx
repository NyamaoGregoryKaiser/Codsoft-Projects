```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, deleteCategory } from '@api/category';
import Button from '@components/Common/Button';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@types-frontend/enums';
import { Category } from '@types-frontend/entities';

const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
        fetchCategories(); // Refresh the list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  if (loading) return <p className="text-center mt-8">Loading categories...</p>;
  if (error) return <p className="alert alert-error text-center mt-8">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
        {isAdmin && (
          <Link to="/categories/new">
            <Button>Add New Category</Button>
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-gray-600">No categories found. {isAdmin && 'Add one now!'}</p>
      ) : (
        <div className="table-container">
          <table className="table-layout">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Created At</th>
                <th className="table-header">Updated At</th>
                {isAdmin && <th className="table-header">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category.id} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  <td className="table-cell">{category.name}</td>
                  <td className="table-cell">{new Date(category.createdAt).toLocaleDateString()}</td>
                  <td className="table-cell">{new Date(category.updatedAt).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td className="table-cell space-x-2">
                      <Link to={`/categories/edit/${category.id}`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(category.id)}>
                        Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoryListPage;
```