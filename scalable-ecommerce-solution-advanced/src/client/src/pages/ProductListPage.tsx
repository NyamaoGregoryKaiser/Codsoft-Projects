import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api';
import { PaginatedResponse, Product } from '../types';
import ProductCard from '../components/product/ProductCard';
import { useSearchParams } from 'react-router-dom';

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchProducts = useCallback(async (page: number, limit: number, category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; category?: string } = { page, limit };
      if (category) {
        params.category = category;
      }
      const response = await axios.get<PaginatedResponse<Product>>('/products', { params });
      setProducts(response.data.data);
      setPagination(response.data.meta);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    fetchProducts(page, limit, category);
  }, [searchParams, fetchProducts]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <p className="col-span-full text-center text-gray-600">No products found.</p>
        )}
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;