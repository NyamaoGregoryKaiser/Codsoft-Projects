import React, { useEffect, useState } from 'react';
import { dbOptimizerApi } from '../api';
import Card from '../components/Card';
import Table from '../components/Table';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';

const SchemaAnalysisPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'open', severity: '', issueType: '' });
  const { user } = useAuth(); // To check user role for action buttons

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await dbOptimizerApi.getSchemaIssues(null, filters);
      setIssues(res.data.data);
    } catch (error) {
      console.error("Error fetching schema issues:", error);
      toast.error('Failed to fetch schema issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    fetchIssues(); // Re-fetch with current filters
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only administrators can update issue status.');
      return;
    }
    try {
      await dbOptimizerApi.updateSchemaIssueStatus(null, issueId, newStatus);
      toast.success(`Issue status updated to ${newStatus}.`);
      fetchIssues(); // Refresh list
    } catch (error) {
      console.error("Error updating schema issue status:", error);
      toast.error('Failed to update issue status.');
    }
  };

  const columns = [
    { header: 'Issue Type', accessor: 'issueType' },
    { header: 'Description', accessor: 'description' },
    { header: 'Object Name', accessor: 'objectName' },
    { header: 'Severity', accessor: 'severity', render: (row) => (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        row.severity === 'high' ? 'bg-red-100 text-red-800' :
        row.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-green-100 text-green-800'
      }`}>
        {row.severity}
      </span>
    ) },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        row.status === 'open' ? 'bg-red-100 text-red-800' :
        row.status === 'resolved' ? 'bg-green-100 text-green-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {row.status}
      </span>
    ) },
    { header: 'Created At', accessor: 'createdAt', render: (row) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') },
    {
      header: 'Actions',
      render: (row) => user?.role === 'admin' && (
        <div className="flex space-x-2">
          {row.status === 'open' && (
            <>
              <button onClick={() => handleUpdateStatus(row.id, 'resolved')} className="text-green-600 hover:text-green-900 text-sm">
                Mark Resolved
              </button>
              <button onClick={() => handleUpdateStatus(row.id, 'ignored')} className="text-gray-600 hover:text-gray-900 text-sm">
                Ignore
              </button>
            </>
          )}
          {row.status !== 'open' && (
            <button onClick={() => handleUpdateStatus(row.id, 'open')} className="text-blue-600 hover:text-blue-900 text-sm">
              Reopen
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold mb-6 text-dark">Schema Analysis</h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              id="status"
              className="mt-1 input-field"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700">Severity</label>
            <select
              name="severity"
              id="severity"
              className="mt-1 input-field"
              value={filters.severity}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="issueType" className="block text-sm font-medium text-gray-700">Issue Type</label>
            <input
              type="text"
              name="issueType"
              id="issueType"
              className="mt-1 input-field"
              value={filters.issueType}
              onChange={handleFilterChange}
              placeholder="e.g., MissingForeignKey"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleApplyFilters} className="btn-primary">Apply Filters</button>
          </div>
        </div>
      </Card>

      <Card title="Detected Schema Issues">
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading issues...</div>
        ) : (
          <Table columns={columns} data={issues} emptyMessage="No schema issues found matching filters." />
        )}
      </Card>
    </div>
  );
};

export default SchemaAnalysisPage;
```

#### `frontend/src/pages/MetricsPage.js`
```javascript