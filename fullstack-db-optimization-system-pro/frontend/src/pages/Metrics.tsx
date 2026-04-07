import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metricsApi } from '@api/metrics';
import Table from '@components/Table';
import ChartComponent from '@components/ChartComponent';
import { Metric, MetricChartData } from '@types';
import { PlayIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { databasesApi } from '@api/databases'; // To get database name

const Metrics: React.FC = () => {
  const { dbId } = useParams<{ dbId: string }>();
  const databaseId = dbId ? parseInt(dbId) : null;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [formData, setFormData] = useState<Omit<Metric, 'id'> | Metric>({
    databaseId: databaseId!,
    timestamp: new Date().toISOString(),
    cpuUsagePercent: 0,
    memoryUsagePercent: 0,
    diskIoOpsSec: 0,
    activeConnections: 0,
    totalQueriesSec: 0,
    avgQueryLatencyMs: 0,
    slowQueriesJson: {},
    customMetricsJson: {},
  });

  const { data: database, isLoading: isLoadingDatabase } = useQuery({
    queryKey: ['database', databaseId],
    queryFn: () => databasesApi.getDatabaseById(databaseId!),
    enabled: !!databaseId,
  });

  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    queryKey: ['metrics', databaseId],
    queryFn: () => metricsApi.getMetricsByDatabaseId(databaseId!),
    enabled: !!databaseId,
  });

  const createMetricMutation = useMutation({
    mutationFn: metricsApi.createMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', databaseId] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => alert(`Error creating metric: ${err.message}`),
  });

  const updateMetricMutation = useMutation({
    mutationFn: ({ metricId, data }: { metricId: number; data: Omit<Metric, 'id' | 'databaseId' | 'createdAt' | 'updatedAt'> }) =>
      metricsApi.updateMetric(metricId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', databaseId] });
      setIsModalOpen(false);
      setEditingMetric(null);
      resetForm();
    },
    onError: (err: Error) => alert(`Error updating metric: ${err.message}`),
  });

  const deleteMetricMutation = useMutation({
    mutationFn: metricsApi.deleteMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', databaseId] });
    },
    onError: (err: Error) => alert(`Error deleting metric: ${err.message}`),
  });

  const generateMetricsMutation = useMutation({
    mutationFn: ({ dbId, numMetrics }: { dbId: number; numMetrics: number }) =>
      metricsApi.generateSimulatedMetrics(dbId, numMetrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', databaseId] });
    },
    onError: (err: Error) => alert(`Error generating metrics: ${err.message}`),
  });


  const handleCreateNew = () => {
    setEditingMetric(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    setFormData({
      ...metric,
      timestamp: new Date(metric.timestamp).toISOString().slice(0, 16), // Format for datetime-local input
    });
    setIsModalOpen(true);
  };

  const handleDelete = (metricId: number) => {
    if (window.confirm('Are you sure you want to delete this metric?')) {
      deleteMetricMutation.mutate(metricId);
    }
  };

  const handleGenerateMetrics = () => {
    if (databaseId && window.confirm('Generate 10 simulated metrics for this database?')) {
      generateMetricsMutation.mutate({ dbId: databaseId, numMetrics: 10 });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      timestamp: formData.timestamp ? new Date(formData.timestamp).toISOString() : new Date().toISOString(),
      // Ensure slowQueriesJson and customMetricsJson are objects
      slowQueriesJson: typeof formData.slowQueriesJson === 'string' ? JSON.parse(formData.slowQueriesJson || '{}') : formData.slowQueriesJson,
      customMetricsJson: typeof formData.customMetricsJson === 'string' ? JSON.parse(formData.customMetricsJson || '{}') : formData.customMetricsJson,
    };

    if (editingMetric) {
      updateMetricMutation.mutate({ metricId: editingMetric.id, data: payload });
    } else {
      createMetricMutation.mutate(payload as MetricCreate);
    }
  };

  const resetForm = () => {
    setFormData({
      databaseId: databaseId!,
      timestamp: new Date().toISOString().slice(0, 16),
      cpuUsagePercent: 0,
      memoryUsagePercent: 0,
      diskIoOpsSec: 0,
      activeConnections: 0,
      totalQueriesSec: 0,
      avgQueryLatencyMs: 0,
      slowQueriesJson: {},
      customMetricsJson: {},
    });
  };

  const prepareChartData = (metricsData: Metric[] | undefined): MetricChartData => {
    if (!metricsData || metricsData.length === 0) {
      return { labels: [], datasets: [] };
    }
    const sortedMetrics = [...metricsData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      labels: sortedMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: sortedMetrics.map(m => m.cpuUsagePercent),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Memory Usage (%)',
          data: sortedMetrics.map(m => m.memoryUsagePercent),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Avg Query Latency (ms)',
          data: sortedMetrics.map(m => m.avgQueryLatencyMs),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          fill: false,
          tension: 0.4
        }
      ],
    };
  };

  const chartData = prepareChartData(metrics);

  const columns = [
    { header: 'Timestamp', accessor: (row: Metric) => new Date(row.timestamp).toLocaleString(), className: 'w-40' },
    { header: 'CPU (%)', accessor: (row: Metric) => row.cpuUsagePercent.toFixed(2), className: 'w-20' },
    { header: 'Memory (%)', accessor: (row: Metric) => row.memoryUsagePercent.toFixed(2), className: 'w-20' },
    { header: 'Disk I/O', accessor: (row: Metric) => row.diskIoOpsSec.toFixed(2), className: 'w-20' },
    { header: 'Connections', accessor: 'activeConnections', className: 'w-20' },
    { header: 'Queries/sec', accessor: (row: Metric) => row.totalQueriesSec.toFixed(2), className: 'w-24' },
    { header: 'Latency (ms)', accessor: (row: Metric) => row.avgQueryLatencyMs.toFixed(2), className: 'w-24' },
    {
      header: 'Slow Queries',
      accessor: (row: Metric) => row.slowQueriesJson && row.slowQueriesJson.count > 0
        ? `${row.slowQueriesJson.count} detected`
        : 'None',
      className: 'w-32'
    },
    {
      header: 'Actions',
      accessor: (row: Metric) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="text-indigo-600 hover:text-indigo-900 p-1">
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-900 p-1">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      className: 'w-24'
    },
  ];

  if (isLoadingDatabase || isLoadingMetrics) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
      Loading metrics...
    </div>
  );
  if (metricsError) return <div className="p-4 text-red-600">Error: {metricsError.message}</div>;
  if (!databaseId) return <div className="p-4 text-red-600">Database ID not provided.</div>;
  if (!database) return <div className="p-4 text-red-600">Database not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Performance Metrics for "{database.name}"</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateMetrics}
            disabled={generateMetricsMutation.isPending}
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            {generateMetricsMutation.isPending ? 'Generating...' : 'Generate Simulated Metrics'}
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add New Metric
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md h-[500px] mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Trends</h2>
        <ChartComponent data={chartData} title={`Performance Trends for ${database.name}`} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Metric History</h2>
      <Table<Metric>
        data={metrics || []}
        columns={columns}
        getKey={(metric) => metric.id}
        isLoading={isLoadingMetrics}
        emptyMessage="No metric data available for this database."
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingMetric ? 'Edit Metric' : 'Add New Metric'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">Timestamp</label>
                <input
                  type="datetime-local"
                  id="timestamp"
                  name="timestamp"
                  value={formData.timestamp ? new Date(formData.timestamp).toISOString().slice(0, 16) : ''}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cpuUsagePercent" className="block text-sm font-medium text-gray-700">CPU Usage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="cpuUsagePercent"
                    name="cpuUsagePercent"
                    value={formData.cpuUsagePercent}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="memoryUsagePercent" className="block text-sm font-medium text-gray-700">Memory Usage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="memoryUsagePercent"
                    name="memoryUsagePercent"
                    value={formData.memoryUsagePercent}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="diskIoOpsSec" className="block text-sm font-medium text-gray-700">Disk I/O (Ops/Sec)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="diskIoOpsSec"
                    name="diskIoOpsSec"
                    value={formData.diskIoOpsSec}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="activeConnections" className="block text-sm font-medium text-gray-700">Active Connections</label>
                  <input
                    type="number"
                    id="activeConnections"
                    name="activeConnections"
                    value={formData.activeConnections}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="totalQueriesSec" className="block text-sm font-medium text-gray-700">Total Queries/Sec</label>
                  <input
                    type="number"
                    step="0.01"
                    id="totalQueriesSec"
                    name="totalQueriesSec"
                    value={formData.totalQueriesSec}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="avgQueryLatencyMs" className="block text-sm font-medium text-gray-700">Avg Query Latency (ms)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="avgQueryLatencyMs"
                    name="avgQueryLatencyMs"
                    value={formData.avgQueryLatencyMs}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="slowQueriesJson" className="block text-sm font-medium text-gray-700">Slow Queries JSON (e.g., {"{\"count\": 2, \"examples\": [\"query1\", \"query2\"]}"})</label>
                <textarea
                  id="slowQueriesJson"
                  name="slowQueriesJson"
                  rows={3}
                  value={JSON.stringify(formData.slowQueriesJson, null, 2)}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-xs focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label htmlFor="customMetricsJson" className="block text-sm font-medium text-gray-700">Custom Metrics JSON</label>
                <textarea
                  id="customMetricsJson"
                  name="customMetricsJson"
                  rows={3}
                  value={JSON.stringify(formData.customMetricsJson, null, 2)}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-xs focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMetricMutation.isPending || updateMetricMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingMetric ? 'Update Metric' : 'Add Metric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Metrics;