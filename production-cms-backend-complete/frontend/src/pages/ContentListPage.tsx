import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchContent, deleteContent } from '../api/contentApi';
import { Content, ContentStatus, PaginationMeta, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';

const ContentListPage: React.FC = () => {
  const [contentList, setContentList] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContentStatus | ''>('');

  const { isAuthenticated, user, isEditor, isAdmin } = useAuth();

  useEffect(() => {
    loadContent(currentPage, searchQuery, filterStatus);
  }, [currentPage, searchQuery, filterStatus]);

  const loadContent = async (page: number, search: string, status: ContentStatus | '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchContent({ page, limit: 10, search, status: status || undefined });
      if (response.success) {
        setContentList(response.data);
        if (response.meta) {
          setMeta(response.meta);
        }
      } else {
        setError(response.message || 'Failed to fetch content.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(id);
        loadContent(currentPage, searchQuery, filterStatus); // Reload content
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to delete content.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value as ContentStatus | '');
    setCurrentPage(1); // Reset to first page on status filter
  };

  if (loading) {
    return <div className="container py-8 text-center">Loading content...</div>;
  }

  if (error) {
    return <div className="container py-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content List</h1>
        {(isEditor || isAdmin) && (
          <Link to="/content/new" className="btn btn-primary">
            Create New Content
          </Link>
        )}
      </div>

      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          placeholder="Search by title or body..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="input-field flex-grow"
        />
        <select
          value={filterStatus}
          onChange={handleStatusChange}
          className="input-field w-48"
        >
          <option value="">All Statuses</option>
          {Object.values(ContentStatus).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {contentList.length === 0 ? (
        <p className="text-center text-gray-500">No content found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Title</th>
                  <th className="py-2 px-4 border-b text-left hidden md:table-cell">Category</th>
                  <th className="py-2 px-4 border-b text-left hidden sm:table-cell">Author</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left hidden lg:table-cell">Featured</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contentList.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">
                      <Link to={`/content/${content.id}`} className="text-indigo-600 hover:underline">
                        {content.title}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b hidden md:table-cell">{content.category?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b hidden sm:table-cell">{content.author?.email || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${content.status === ContentStatus.PUBLISHED ? 'bg-green-100 text-green-800' :
                          content.status === ContentStatus.DRAFT ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {content.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b hidden lg:table-cell">
                      {content.isFeatured ? 'Yes' : 'No'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <Link to={`/content/edit/${content.id}`} className="text-blue-600 hover:text-blue-800 mr-2">
                        Edit
                      </Link>
                      {(isAdmin || (isEditor && user?.id === content.author.id)) && (
                        <button
                          onClick={() => handleDelete(content.id)}
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

export default ContentListPage;