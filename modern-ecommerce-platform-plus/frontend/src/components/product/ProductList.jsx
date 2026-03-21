import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import * as productApi from '../../api/products';
import { useLocation, useNavigate } from 'react-router-dom';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalResults: 0 });
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialPage = parseInt(queryParams.get('page') || '1', 10);
  const initialLimit = parseInt(queryParams.get('limit') || '10', 10);
  const initialSearch = queryParams.get('search') || '';
  const initialCategory = queryParams.get('category') || '';
  const initialSortBy = queryParams.get('sortBy') || 'createdAt';
  const initialOrder = queryParams.get('order') || 'desc';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: initialPage,
          limit: initialLimit,
          ...(initialSearch && { name: initialSearch }),
          ...(initialCategory && { categoryId: initialCategory }),
          sortBy: initialSortBy,
          order: initialOrder,
        };
        const response = await productApi.getProducts(params);
        setProducts(response.data.data.products);
        setPagination({
          page: response.data.data.page,
          limit: response.data.data.limit,
          totalPages: response.data.data.totalPages,
          totalResults: response.data.data.totalResults,
        });
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialPage, initialLimit, initialSearch, initialCategory, initialSortBy, initialOrder]);

  const handlePageChange = (newPage) => {
    const newSearchParams = new URLSearchParams(queryParams);
    newSearchParams.set('page', newPage);
    navigate({ search: newSearchParams.toString() });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(queryParams);
    newSearchParams.set('search', searchQuery);
    newSearchParams.set('page', 1); // Reset to first page on new search
    navigate({ search: newSearchParams.toString() });
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    const newSearchParams = new URLSearchParams(queryParams);
    if (e.target.value) {
      newSearchParams.set('category', e.target.value);
    } else {
      newSearchParams.delete('category');
    }
    newSearchParams.set('page', 1);
    navigate({ search: newSearchParams.toString() });
  };

  const handleSortChange = (e) => {
    const [newSortBy, newOrder] = e.target.value.split('-');
    setSortBy(newSortBy);
    setOrder(newOrder);
    const newSearchParams = new URLSearchParams(queryParams);
    newSearchParams.set('sortBy', newSortBy);
    newSearchParams.set('order', newOrder);
    newSearchParams.set('page', 1);
    navigate({ search: newSearchParams.toString() });
  };

  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  // Mock categories (in a real app, fetch from API)
  const categories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Books' },
    { id: 3, name: 'Clothing' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Our Products</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search products..."
            className="p-2 border border-gray-300 rounded-md w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Category Filter */}
        <div className="w-full md:w-1/4">
          <select
            className="p-2 border border-gray-300 rounded-md w-full"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="w-full md:w-1/4">
          <select
            className="p-2 border border-gray-300 rounded-md w-full"
            value={`${sortBy}-${order}`}
            onChange={handleSortChange}
          >
            <option value="createdAt-desc">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </div>
      </div>


      {products.length === 0 ? (
        <p className="text-center text-gray-600">No products found matching your criteria.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(pagination.totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-md ${
                pagination.page === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;