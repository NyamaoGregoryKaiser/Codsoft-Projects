```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, deleteProduct } from '@api/product';
import Button from '@components/Common/Button';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@types-frontend/enums';
import { Product } from '@types-frontend/entities';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (id) {
      getProductById(id)
        .then((data) => {
          setProduct(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to fetch product details.');
          setLoading(false);
        });
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id!);
        navigate('/products'); // Redirect to product list after deletion
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  if (loading) return <p className="text-center mt-8">Loading product details...</p>;
  if (error) return <p className="alert alert-error text-center mt-8">{error}</p>;
  if (!product) return <p className="text-center mt-8">Product not found.</p>;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
      <p className="text-gray-700 mb-4">{product.description}</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="font-semibold">Price:</span> ${product.price.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Stock:</span> {product.stock} units
        </div>
        <div>
          <span className="font-semibold">Category:</span>{' '}
          {product.category ? product.category.name : 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Created At:</span>{' '}
          {new Date(product.createdAt).toLocaleDateString()}
        </div>
        <div>
          <span className="font-semibold">Last Updated:</span>{' '}
          {new Date(product.updatedAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <Button variant="secondary" onClick={() => navigate('/products')}>
          Back to List
        </Button>
        {isAdmin && (
          <>
            <Button onClick={() => navigate(`/products/edit/${product.id}`)}>Edit</Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
```