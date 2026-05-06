```javascript
import React, { useEffect, useState } from 'react';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import Table from '../components/Table';
import moment from 'moment';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../components/ConfirmModal';
import { Dialog } from '@headlessui/react';
import ScraperResultViewer from '../components/ScraperResultViewer';
import { useSearchParams } from 'react-router-dom';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedResultData, setSelectedResultData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const [searchParams] = useSearchParams();
  const initialScraperId = searchParams.get('scraper_id');

  const [filters, setFilters] = useState({
    status_filter: '',
    scraper_id: initialScraperId || '',
  });

  const fetchTasks = async (page = pagination.page, pageSize = pagination.pageSize, currentFilters = filters) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const params = {
        skip,
        limit: pageSize,
        ...(currentFilters.status_filter && { status_filter: currentFilters.status_filter }),
        ...(currentFilters.scraper_id && { scraper_id: currentFilters.scraper_id }),
      };
      const response = await api.get('/tasks', { params });
      setTasks(response.data.items);
      setPagination({
        ...pagination,
        page,
        pageSize,
        total: response.data.total,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err.response?.data?.detail || 'Failed to load tasks.');
      toast.error(err.response?.data?.detail || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(1, pagination.pageSize, filters); // Fetch with current filters on mount
  }, [filters]); // Re-fetch when filters change

  const handlePageChange = (newPage) => {
    fetchTasks(newPage, pagination.pageSize, filters);
  };

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmModalOpen(false);
    if (!taskToDelete) return;

    try {
      await api.delete(`/tasks/${taskToDelete}`);
      toast.success('Task deleted successfully!');
      fetchTasks(pagination.page, pagination.pageSize, filters);
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete task.');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleViewResults = async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/results`);
      if (response.data.items.length === 0) {
        toast.info('No results found for this task.');
        return;
      }
      setSelectedResultData(response.data.items.map(item => item.data));
      setIsResultModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch task results:', err);
      toast.error(err.response?.data?.detail || 'Failed to load task results.');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading && tasks.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  const tableHeaders = ['Scraper Name', 'Status', 'Started', 'Finished', 'Results Count', 'Owner', 'Actions'];

  const renderTaskRow = (task) => (
    <tr key={task.id}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {task.config?.name || 'N/A'} (ID: {task.scraper_config_id})
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
          task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          task.status === 'FAILED' ? 'bg-red-100 text-red-800' :
          task.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {task.status}
        </span>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {task.start_time ? moment(task.start_time).format('YYYY-MM-DD HH:mm') : 'N/A'}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {task.end_time ? moment(task.end_time).format('YYYY-MM-DD HH:mm') : 'N/A'}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {task.result_count}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {task.owner_username || 'N/A'}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => handleViewResults(task.id)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center"
            title="View Results"
          >
            <EyeIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleDeleteClick(task.id)}
            className="text-red-600 hover:text-red-900 flex items-center"
            title="Delete Task"
          >
            <TrashIcon className="h-5 w-5 mr-1" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Scraping Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            A log of all past and ongoing scraping tasks.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white shadow-sm rounded-lg flex flex-wrap gap-4 items-center">
        <div className="flex-grow">
          <label htmlFor="status_filter" className="block text-sm font-medium text-gray-700">Filter by Status</label>
          <select
            id="status_filter"
            name="status_filter"
            value={filters.status_filter}
            onChange={handleFilterChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="flex-grow">
          <label htmlFor="scraper_id" className="block text-sm font-medium text-gray-700">Filter by Scraper ID</label>
          <input
            type="number"
            id="scraper_id"
            name="scraper_id"
            value={filters.scraper_id}
            onChange={handleFilterChange}
            placeholder="e.g., 123"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex-shrink-0 pt-6"> {/* Added padding top to align with select */}
          <button
            onClick={() => fetchTasks(1, pagination.pageSize, filters)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <Table
          headers={tableHeaders}
          data={tasks}
          renderRow={renderTaskRow}
          emptyMessage="No tasks found matching your criteria."
        />
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={isConfirmModalOpen}
        setOpen={setIsConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? All associated results will also be deleted."
      />

      <Dialog open={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Task Results</h3>
            {selectedResultData && selectedResultData.length > 0 ? (
                selectedResultData.map((result, index) => (
                    <div key={index} className="mb-4 p-3 border rounded-md bg-gray-50">
                        <h4 className="text-md font-semibold text-gray-700 mb-2">Result Item {index + 1}</h4>
                        <ScraperResultViewer resultData={result} />
                    </div>
                ))
            ) : (
                <p>No results found for this task.</p>
            )}
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:w-auto"
                onClick={() => setIsResultModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Tasks;
```