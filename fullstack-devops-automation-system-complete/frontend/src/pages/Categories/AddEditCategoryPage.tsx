```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '@components/Common/Input';
import Button from '@components/Common/Button';
import { getCategoryById, createCategory, updateCategory } from '@api/category';

const AddEditCategoryPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>(); // 'id' will be present for edit mode
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      getCategoryById(id)
        .then((category) => {
          setName(category.name);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load category.');
          setLoading(false);
        });
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isEditMode) {
        await updateCategory(id!, name);
        setSuccess('Category updated successfully!');
      } else {
        await createCategory(name);
        setSuccess('Category created successfully!');
      }
      setTimeout(() => navigate('/categories'), 1500); // Redirect after a short delay
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <p className="text-center">Loading category...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        {isEditMode ? 'Edit Category' : 'Add New Category'}
      </h2>
      <form onSubmit={handleSubmit}>
        <Input
          id="name"
          label="Category Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/categories')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Category'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEditCategoryPage;
```