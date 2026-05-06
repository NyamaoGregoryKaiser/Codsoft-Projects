```javascript
import React, { useEffect, useState } from 'react';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import Table from '../components/Table';
import { PlusIcon, PencilIcon, TrashIcon, PlayIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import ScraperForm from '../components/ScraperForm';
import ConfirmModal from '../components/ConfirmModal';
import { Dialog } from '@headlessui/react';
import useAuth from '../hooks/useAuth';
import ScraperResultViewer from '../components/ScraperResultViewer';
import { SELECTOR_TYPES } from '../utils/constants';

const Scrapers = () => {
  const { user } = useAuth();
  const [scrapers, setScrapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentScraper, setCurrentScraper] = useState(null);
  const [selectedResultData, setSelectedResultData] = useState(null);
  const [operation, setOperation] = useState('create'); // 'create' or 'edit'
  const [scraperToDelete, setScraperToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchScrapers = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await api.get('/scrapers', { params: { skip, limit: pageSize } });
      setScrapers(response.data.items);
      setPagination({
        ...pagination,
        page,
        pageSize,
        total: response.data.total,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch scrapers:', err);
      setError(err.response?.data?.detail || 'Failed to load scrapers.');
      toast.error(err.response?.data?.detail || 'Failed to load scrapers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapers();
  }, []);

  const handlePageChange = (newPage) => {
    fetchScrapers(newPage);
  };

  const handleCreateClick = () => {
    setOperation('create');
    setCurrentScraper({
      name: '',
      start_url: '',
      description: '',
      schedule_cron: '',
      headless: true,
      use_proxy: false,
      use_user_agent: false,
      is_active: true,
      selectors: [{ name: '', selector: '', type: 'text', attribute: '' }], // Default initial selector
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (scraper) => {
    setOperation('edit');
    // Ensure selectors are parsed from JSON string if needed
    const parsedScraper = {
      ...scraper,
      selectors: scraper.selectors, // Already parsed by Pydantic on backend, or ensure parsing if raw string is passed
    };
    setCurrentScraper(parsedScraper);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (scraperId) => {
    setScraperToDelete(scraperId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmModalOpen(false);
    if (!scraperToDelete) return;

    try {
      await api.delete(`/scrapers/${scraperToDelete}`);
      toast.success('Scraper deleted successfully!');
      fetchScrapers();
    } catch (err) {
      console.error('Failed to delete scraper:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete scraper.');
    } finally {
      setScraperToDelete(null);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      if (operation === 'create') {
        await api.post('/scrapers', values);
        toast.success('Scraper created successfully!');
      } else if (operation === 'edit' && currentScraper) {
        await api.put(`/scrapers/${currentScraper.id}`, values);
        toast.success('Scraper updated successfully!');
      }
      setIsModalOpen(false);
      fetchScrapers();
    } catch (err) {
      console.error('Failed to save scraper:', err);
      toast.error(err.response?.data?.detail || 'Failed to save scraper.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunScraper = async (scraperId) => {
    try {
      const response = await api.post(`/scrapers/${scraperId}/run`);
      toast.success(`Scraper "${response.data.config.name}" triggered successfully! Task ID: ${response.data.id}`);
    } catch (err) {
      console.error('Failed to trigger scraper:', err);
      toast.error(err.response?.data?.detail || 'Failed to trigger scraper.');
    }
  };

  const handleViewLatestResult = async (scraperId) => {
    try {
      const response = await api.get(`/tasks`, { params: { scraper_id: scraperId, status_filter: 'COMPLETED', limit: 1 } });
      if (response.data.items.length === 0) {
        toast.info("No completed tasks found for this scraper yet.");
        return;
      }
      const latestTask = response.data.items[0];
      const resultsResponse = await api.get(`/tasks/${latestTask.id}/results`, { params: { limit: 1 } });
      if (resultsResponse.data.items.length === 0) {
        toast.info("No results found for the latest completed task.");
        return;
      }
      setSelectedResultData(resultsResponse.data.items[0].data);
      setIsResultModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch latest result:', err);
      toast.error(err.response?.data?.detail || 'Failed to fetch latest result.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  const tableHeaders = ['Name', 'URL', 'Schedule', 'Active', 'Owner', 'Actions'];

  const renderScraperRow = (scraper) => (
    <tr key={scraper.id}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {scraper.name}
      </td>
      <td className="py-4 px-3 text-sm text-gray-500 max-w-xs truncate">
        <a href={scraper.start_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
          {scraper.start_url}
        </a>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {scraper.schedule_cron || 'Manual'}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
          scraper.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {scraper.is_active ? 'Yes' : 'No'}
        </span>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {scraper.owner_username || 'N/A'} {scraper.owner_id === user.id && '(Me)'}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => handleRunScraper(scraper.id)}
            className="text-green-600 hover:text-green-900 flex items-center"
            title="Run Scraper Now"
          >
            <PlayIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleViewLatestResult(scraper.id)}
            className="text-blue-600 hover:text-blue-900 flex items-center"
            title="View Latest Result"
          >
            <CodeBracketIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleEditClick(scraper)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center"
            title="Edit Scraper"
          >
            <PencilIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleDeleteClick(scraper.id)}
            className="text-red-600 hover:text-red-900 flex items-center"
            title="Delete Scraper"
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
          <h1 className="text-3xl font-bold text-gray-900">Scrapers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your web scrapers, including their name, URL, and schedule.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Scraper
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <Table
          headers={tableHeaders}
          data={scrapers}
          renderRow={renderScraperRow}
          emptyMessage="You haven't created any scrapers yet. Click 'Add Scraper' to get started!"
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

      {/* Scraper Form Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {operation === 'create' ? 'Create New Scraper' : `Edit Scraper: ${currentScraper?.name}`}
            </h3>
            {currentScraper && (
              <ScraperForm
                initialValues={currentScraper}
                onSubmit={handleFormSubmit}
                isSubmitting={false} // Adjust as needed
              />
            )}
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:w-auto"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Dialog>


      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={isConfirmModalOpen}
        setOpen={setIsConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Scraper"
        message="Are you sure you want to delete this scraper? All associated tasks and results will also be deleted."
      />

      {/* Scraper Result Viewer Modal */}
      <Dialog open={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Latest Scraped Result</h3>
            <ScraperResultViewer resultData={selectedResultData} />
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

export default Scrapers;
```