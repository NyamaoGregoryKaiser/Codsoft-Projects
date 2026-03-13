```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '@api/product';
import { getCategories } from '@api/category';
import Button from '@components/Common/Button';
import Input from '@components/Common/Input';
import Select from '@components/Common/Select';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@types-frontend/enums';
import { Product, Category } from '@types-frontend/entities';

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: productsPerPage,
        offset: (currentPage - 1) * productsPerPage,
        ...(selectedCategory && { category: categories.find(cat => cat.id === selectedCategory)?.name }),
        ...(searchTerm && { search: searchTerm }),
      };
      const data = await getProducts(params);
      setProducts(data.products);
      setTotalPages(Math.ceil(data.total / productsPerPage));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, currentPage, productsPerPage, categories]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      // Don't block product list if categories fail to load
      console.error('Failed to load categories for filter:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        fetchProducts(); // Refresh the list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <p className="text-center mt-8">Loading products...</p>;
  if (error) return <p className="alert alert-error text-center mt-8">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        {isAdmin && (
          <Link to="/products/new">
            <Button>Add New Product</Button>
          </Link>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <Input
            id="search"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select
            id="categoryFilter"
            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            placeholder="Filter by category"
          />
        </div>
        <Button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setCurrentPage(1); }} variant="ghost">Clear Filters</Button>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-600">No products found. {isAdmin && 'Add one now!'}</p>
      ) : (
        <div className="table-container">
          <table className="table-layout">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Price</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  <td className="table-cell">
                    <Link to={`/products/${product.id}`} className="form-link">
                      {product.name}
                    </Link>
                  </td>
                  <td className="table-cell">{product.category ? product.category.name : 'N/A'}</td>
                  <td className="table-cell">${product.price.toFixed(2)}</td>
                  <td className="table-cell">{product.stock}</td>
                  <td className="table-cell space-x-2">
                    <Link to={`/products/${product.id}`}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        <Link to={`/products/edit/${product.id}`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="ghost"
          >
            Previous
          </Button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="ghost"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
```