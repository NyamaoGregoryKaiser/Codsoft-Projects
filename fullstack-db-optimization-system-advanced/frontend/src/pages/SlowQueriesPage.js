import React, { useEffect, useState } from 'react';
import { dbOptimizerApi } from '../api';
import Card from '../components/Card';
import Table from '../components/Table';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SlowQueriesPage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ minDuration: '500', queryText: '' });
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await dbOptimizerApi.getSlowQueries(null, {
        page: currentPage,
        pageSize: 10,
        ...filters,
      });
      setQueries(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching slow queries:", error);
      toast.error('Failed to fetch slow queries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [currentPage, filters]); // Re-fetch when page or filters change

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying new filters
    fetchQueries();
  };

  const handleRowClick = (query) => {
    setSelectedQuery(query);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Query Text', accessor: 'queryText', render: (row) => <span className="font-mono text-xs max-w-sm overflow-hidden text-ellipsis block">{row.queryText}</span> },
    { header: 'Duration (ms)', accessor: 'durationMs', render: (row) => <span className="font-semibold text-red-600">{row.durationMs}</span> },
    { header: 'Occurred At', accessor: 'occurredAt', render: (row) => dayjs(row.occurredAt).format('YYYY-MM-DD HH:mm:ss') },
    // { header: 'Hash', accessor: 'hash' },
  ];

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold mb-6 text-dark">Slow Queries</h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="minDuration" className="block text-sm font-medium text-gray-700">Min. Duration (ms)</label>
            <input
              type="number"
              name="minDuration"
              id="minDuration"
              className="mt-1 input-field"
              value={filters.minDuration}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label htmlFor="queryText" className="block text-sm font-medium text-gray-700">Query Text Contains</label>
            <input
              type="text"
              name="queryText"
              id="queryText"
              className="mt-1 input-field"
              value={filters.queryText}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleApplyFilters} className="btn-primary">Apply Filters</button>
          </div>
        </div>
      </Card>

      <Card title="Recent Slow Queries">
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading queries...</div>
        ) : (
          <>
            <Table columns={columns} data={queries} onRowClick={handleRowClick} emptyMessage="No slow queries found matching filters." />
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-primary disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </Card>

      {/* Query Detail Modal */}
      <Transition appear show={isModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    Query Details
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </DialogTitle>
                  <div className="mt-2">
                    {selectedQuery && (
                      <div className="space-y-4">
                        <p><strong className="block text-gray-700">ID:</strong> {selectedQuery.id}</p>
                        <p><strong className="block text-gray-700">Duration:</strong> {selectedQuery.durationMs} ms</p>
                        <p><strong className="block text-gray-700">Occurred At:</strong> {dayjs(selectedQuery.occurredAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                        <div>
                          <strong className="block text-gray-700">Query Text:</strong>
                          <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap">{selectedQuery.queryText}</pre>
                        </div>
                        {selectedQuery.executionPlanText && (
                          <div>
                            <strong className="block text-gray-700">Execution Plan:</strong>
                            <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                              {JSON.stringify(JSON.parse(selectedQuery.executionPlanText), null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedQuery.queryExplanation && selectedQuery.queryExplanation.length > 0 && (
                          <div>
                            <strong className="block text-gray-700">Detailed Explanations:</strong>
                            {selectedQuery.queryExplanation.map((exp, idx) => (
                              <div key={idx} className="bg-blue-50 p-3 rounded-md text-sm mt-2">
                                <p><strong>Plan Type:</strong> {exp.planType}</p>
                                <p><strong>Cost:</strong> {exp.cost}</p>
                                <p><strong>Rows:</strong> {exp.rows}</p>
                                {exp.actualTime && <p><strong>Actual Time:</strong> {exp.actualTime} ms</p>}
                                {exp.detail && (
                                  <div>
                                    <p><strong>Detail:</strong></p>
                                    <pre className="bg-blue-100 p-2 rounded-md text-xs whitespace-pre-wrap max-h-48 overflow-auto">{JSON.stringify(exp.detail, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default SlowQueriesPage;
```

#### `frontend/src/pages/IndexSuggestionsPage.js`
```javascript