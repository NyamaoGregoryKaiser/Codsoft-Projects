```javascript
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import PlotlyChart from '../components/PlotlyChart';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

const DatasetDetail = () => {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const datasetResponse = await api.get(`/datasets/${id}`);
        setDataset(datasetResponse.data);

        const statsResponse = await api.get(`/datasets/${id}/stats`);
        setStats(statsResponse.data);
      } catch (err) {
        console.error("Failed to fetch dataset details:", err);
        setError(err.response?.data?.detail || "Failed to load dataset details.");
        toast.error(err.response?.data?.detail || "Failed to load dataset details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 text-lg mt-10">{error}</div>;
  }

  if (!dataset) {
    return <div className="text-center text-gray-500 text-lg mt-10">Dataset not found.</div>;
  }

  // Example for generating a histogram/bar chart for a column
  const generateColumnPlot = (columnName, colData) => {
    if (!stats || !stats.head) return null; // Ensure stats and head data exist

    const column = stats.columns.find(c => c.name === columnName);
    if (!column) return null;

    const isNumerical = ['int64', 'float64', 'int32', 'float32'].includes(column.dtype);

    const plotData = [];
    let layout = {
      title: `Distribution of ${columnName}`,
      xaxis: { title: columnName },
      yaxis: { title: 'Count' },
      margin: { t: 50, b: 50, l: 50, r: 50 }
    };

    if (isNumerical) {
      // Histogram for numerical data
      const values = stats.head.map(row => row[columnName]).filter(v => v != null);
      if (values.length > 0) {
        plotData.push({
          x: values,
          type: 'histogram',
          marker: { color: 'rgba(55,128,191,0.6)', line: { color: 'rgba(55,128,191,1.0)', width: 1 } },
        });
      }
    } else {
      // Bar chart for categorical data (value counts)
      const valueCounts = column.value_counts;
      if (valueCounts) {
        const labels = Object.keys(valueCounts);
        const values = Object.values(valueCounts);
        plotData.push({
          x: labels,
          y: values,
          type: 'bar',
          marker: { color: 'rgba(219,64,82,0.6)', line: { color: 'rgba(219,64,82,1.0)', width: 1 } },
        });
      }
    }

    if (plotData.length === 0 || (isNumerical && plotData[0].x.length === 0)) return null;

    return <PlotlyChart data={plotData} layout={layout} style={{ height: '350px' }} />;
  };


  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/datasets" className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Datasets
        </Link>
        <h1 className="text-3xl font-bold leading-tight text-gray-900">{dataset.name}</h1>
        <p className="mt-2 text-gray-700">{dataset.description || "No description provided."}</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Metadata</h3>
            <p className="text-sm text-gray-700"><strong>ID:</strong> {dataset.id}</p>
            <p className="text-sm text-gray-700"><strong>Owner:</strong> {dataset.owner_id}</p>
            <p className="text-sm text-gray-700"><strong>Rows:</strong> {dataset.row_count}</p>
            <p className="text-sm text-gray-700"><strong>Columns:</strong> {dataset.column_count}</p>
            <p className="text-sm text-gray-700"><strong>File Size:</strong> {(dataset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-sm text-gray-700"><strong>Created:</strong> {dayjs(dataset.created_at).format('YYYY-MM-DD HH:mm')}</p>
            <p className="text-sm text-gray-700"><strong>Updated:</strong> {dayjs(dataset.updated_at).format('YYYY-MM-DD HH:mm')}</p>
            <p className="text-sm text-gray-700"><strong>Preprocessed:</strong> {dataset.is_preprocessed ? 'Yes' : 'No'}</p>
            {dataset.original_dataset_id && (
              <p className="text-sm text-gray-700"><strong>Original ID:</strong> <Link to={`/datasets/${dataset.original_dataset_id}`} className="text-blue-600 hover:underline">{dataset.original_dataset_id}</Link></p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-5 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Dataset Head (First 5 Rows)</h3>
            {stats?.head && stats.head.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(stats.head[0]).map(col => (
                        <th key={col} scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                    {stats.head.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((val, valIndex) => (
                          <td key={valIndex} className="px-3 py-2 whitespace-nowrap">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available for head.</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Column Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats?.columns.map(column => (
              <div key={column.name} className="bg-white shadow rounded-lg p-5">
                <h3 className="text-lg font-medium text-gray-900">{column.name}</h3>
                <p className="text-sm text-gray-600"><strong>Type:</strong> {column.dtype}</p>
                <p className="text-sm text-gray-600"><strong>Unique Values:</strong> {column.unique_values}</p>
                <p className="text-sm text-gray-600"><strong>Missing Values:</strong> {column.missing_values}</p>
                {column.mean !== undefined && <p className="text-sm text-gray-600"><strong>Mean:</strong> {column.mean?.toFixed(4)}</p>}
                {column.median !== undefined && <p className="text-sm text-gray-600"><strong>Median:</strong> {column.median?.toFixed(4)}</p>}
                {column.std !== undefined && <p className="text-sm text-gray-600"><strong>Std Dev:</strong> {column.std?.toFixed(4)}</p>}
                {column.min !== undefined && <p className="text-sm text-gray-600"><strong>Min:</strong> {String(column.min)}</p>}
                {column.max !== undefined && <p className="text-sm text-gray-600"><strong>Max:</strong> {String(column.max)}</p>}
                {column.value_counts && Object.keys(column.value_counts).length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-800">Top Value Counts:</h4>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {Object.entries(column.value_counts).map(([val, count]) => (
                        <li key={val}>{val}: {count}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4">
                  {generateColumnPlot(column.name, column)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDetail;
```