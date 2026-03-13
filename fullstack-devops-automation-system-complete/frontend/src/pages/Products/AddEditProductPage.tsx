```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '@components/Common/Input';
import Button from '@components/Common/Button';
import Textarea from '@components/Common/Textarea';
import Select from '@components/Common/Select';
import { getProductById, createProduct, updateProduct } from '@api/product';
import { getCategories } from '@api/category';
import { Category } from '@types-frontend/entities';

const AddEditProductPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>(); // 'id' will be present for edit mode
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!id;

  useEffect(() => {
    // Fetch categories for the dropdown
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load categories.'));

    if (isEditMode) {
      setLoading(true);
      getProductById(id)
        .then((product) => {
          setName(product.name);
          setDescription(product.description || '');
          setPrice(product.price);
          setStock(product.stock);
          setCategoryId(product.category?.id || ''); // Set selected category, handle null
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load product.');
          setLoading(false);
        });
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const productData = {
      name,
      description: description || null,
      price: parseFloat(price as string),
      stock: parseInt(stock as string, 10),
      categoryId: categoryId || null, // Allow null for categoryId
    };

    try {
      if (isEditMode) {
        await updateProduct(id!, productData);
        setSuccess('Product updated successfully!');
      } else {
        await createProduct(productData);
        setSuccess('Product created successfully!');
      }
      setTimeout(() => navigate('/products'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <p className="text-center">Loading product...</p>;
  if (!loading && categories.length === 0 && !error && !isEditMode) return <p className="text-center">No categories available. Please add a category first.</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        {isEditMode ? 'Edit Product' : 'Add New Product'}
      </h2>
      <form onSubmit={handleSubmit}>
        <Input
          id="name"
          label="Product Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          id="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          id="price"
          label="Price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <Input
          id="stock"
          label="Stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
        <Select
          id="categoryId"
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          placeholder="Select a category (optional)"
        />
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEditProductPage;
```