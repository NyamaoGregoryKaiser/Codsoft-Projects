import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPageById } from '../../api/applications';
import { getPageMetrics, getMetricTrends } from '../../api/reports';
import { Page, PerformanceMetric, MetricTrendData, BreakdownData } from '../../types';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import dayjs from 'dayjs';
import Button from '../../components/ui/Button'; // For period selection

const METRIC_TYPES = ['FCP', 'LCP', 'TTFB', 'CLS', 'PageLoadTime']; // Common metrics

const PageDetails: React.FC = () => {
  const { appId, pageId } = useParams<{ appId: string; pageId: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>(METRIC_TYPES[0]);
  const [periodDays, setPeriodDays] = useState<number>(7); // Default to 7 days

  const [metricData, setMetricData] = useState<PerformanceMetric[]>([]);
  const [metricTrends, setMetricTrends] = useState<MetricTrendData[]>([]);
  const [browserBreakdown, setBrowserBreakdown] = useState<BreakdownData[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<BreakdownData[]>([]);

  const fetchPageAndMetrics = async () => {
    if (!appId || !pageId) return;
    setLoading(true);
    setError(null);
    try {
      const pageData = await getPageById(appId, pageId);
      setPage(pageData);

      const metricsReport = await getPageMetrics(appId, pageId, selectedMetric, periodDays);
      setMetricData(metricsReport.metrics);
      setBrowserBreakdown(metricsReport.browserBreakdown);
      setDeviceBreakdown(metricsReport.deviceBreakdown);

      const trendsData = await getMetricTrends(appId, selectedMetric, pageId, periodDays);
      setMetricTrends(trendsData);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch page details or metrics');
      console.error('Fetch page data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageAndMetrics();
  }, [appId, pageId, selectedMetric, periodDays]);

  if (loading) return <div className="text-center py-8">Loading page details...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!page) return <div className="text-center py-8">Page not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{page.name}</h1>
      <p className="text-gray-600 mb-4">Path Regex: <span className="font-mono bg-gray-100 p-1 rounded text-sm">{page.pathRegex || 'N/A'}</span></p>

      <div className="flex items-center space-x-4 mb-6">
        <label htmlFor="metric-select" className="text-gray-700 font-medium">Select Metric:</label>
        <select
          id="metric-select"
          className="block w-48 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
        >
          {METRIC_TYPES.map((type) => (
            <option key={type} value={type}>
              {type} {type === 'CLS' ? '(Score)' : '(ms)'}
            </option>
          ))}
        </select>

        <label htmlFor="period-select" className="text-gray-700 font-medium">Period:</label>
        <select
          id="period-select"
          className="block w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={periodDays}
          onChange={(e) => setPeriodDays(parseInt(e.target.value))}
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChart
          data={metricTrends}
          dataKey="averageValue"
          xDataKey="date"
          title={`${selectedMetric} Trend (Avg. over ${periodDays} days)`}
          yAxisLabel={selectedMetric === 'CLS' ? 'Score' : 'Milliseconds'}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PieChart data={browserBreakdown} dataKey="browser" title={`${selectedMetric} by Browser`} />
            <PieChart data={deviceBreakdown} dataKey="deviceType" title={`${selectedMetric} by Device Type`} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent {selectedMetric} Metrics</h2>
        {metricData.length === 0 ? (
          <p className="text-gray-600">No recent metrics found for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value {selectedMetric === 'CLS' ? '(Score)' : '(ms)'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Browser
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OS
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metricData.slice(0, 10).map((metric) => ( // Show last 10 for brevity
                  <tr key={metric.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{dayjs(metric.timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{metric.value.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{metric.browser || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{metric.os || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{metric.deviceType || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{metric.userSessionId?.substring(0, 8) || 'N/A'}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageDetails;