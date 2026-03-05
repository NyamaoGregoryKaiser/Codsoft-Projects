import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Select, Spin, Alert, Typography, DatePicker, Space } from 'antd';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import moment from 'moment';
import { getConnections } from '../api/connections';
import { getMetricsHistory } from '../api/metrics';
import { useParams } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

const { Option } = Select;
const { Title } = Typography;
const { RangePicker } = DatePicker;

const timeRangeOptions = [
  { label: 'Last 1 Hour', value: '1h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

function MetricsMonitorPage() {
  const { connectionId: urlConnectionId } = useParams(); // Get connectionId from URL if present
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(urlConnectionId || null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [customDateRange, setCustomDateRange] = useState(null); // moment objects

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchMetricsHistory(selectedConnection, timeRange, customDateRange);
    } else {
      setMetricsHistory([]);
    }
  }, [selectedConnection, timeRange, customDateRange]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await getConnections();
      setConnections(data);
      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0].id); // Select first connection if none in URL
      }
    } catch (err) {
      setError('Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricsHistory = async (connId, range, customRange) => {
    if (!connId) return;
    setLoading(true);
    setError(null);
    try {
      // In a real scenario, customRange would be passed to API for filtering by date
      const data = await getMetricsHistory(connId, range);
      setMetricsHistory(data);
    } catch (err) {
      setError(`Failed to load metrics history: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (metrics, metricKey, label, color) => {
    return {
      labels: metrics.map((m) => new Date(m.created_at).toLocaleString()),
      datasets: [
        {
          label: label,
          data: metrics.map((m) => m[metricKey]),
          borderColor: color,
          backgroundColor: `${color}50`, // 50% opacity
          tension: 0.1,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true },
      x: { title: { display: true, text: 'Time' } },
    },
  };

  if (loading && connections.length === 0) return <Spin tip="Loading connections..." size="large" />;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;
  if (connections.length === 0) return <Alert message="No connections found. Please add a database connection to monitor metrics." type="info" showIcon />;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Metrics Monitor</Title>
        </Col>
        <Col>
          <Space>
            <Select
              placeholder="Select Connection"
              style={{ width: 200 }}
              onChange={setSelectedConnection}
              value={selectedConnection}
            >
              {connections.map((conn) => (
                <Option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.database})
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Time Range"
              style={{ width: 150 }}
              onChange={setTimeRange}
              value={timeRange}
            >
              {timeRangeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
              <Option value="custom">Custom Range</Option>
            </Select>
            {timeRange === 'custom' && (
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                onChange={setCustomDateRange}
                value={customDateRange}
              />
            )}
          </Space>
        </Col>
      </Row>

      {!selectedConnection ? (
        <Alert message="Please select a database connection to view its metrics." type="info" showIcon />
      ) : (
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Active Connections Over Time" bordered={false}>
                {metricsHistory.length > 0 ? (
                  <Line
                    data={generateChartData(metricsHistory, 'active_connections', 'Active Connections', 'rgb(75, 192, 192)')}
                    options={chartOptions}
                  />
                ) : (
                  <Alert message="No active connections data available for this range." type="info" />
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Database Size Over Time" bordered={false}>
                {metricsHistory.length > 0 ? (
                  <Line
                    data={generateChartData(
                      metricsHistory.map(m => ({ ...m, database_size_gb: m.database_size_bytes / (1024 * 1024 * 1024) })),
                      'database_size_gb',
                      'Database Size (GB)',
                      'rgb(54, 162, 235)'
                    )}
                    options={chartOptions}
                  />
                ) : (
                  <Alert message="No database size data available for this range." type="info" />
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Cache Hit Ratio Over Time" bordered={false}>
                {metricsHistory.length > 0 ? (
                  <Line
                    data={generateChartData(metricsHistory, 'cache_hit_ratio_percent', 'Cache Hit Ratio (%)', 'rgb(153, 102, 255)')}
                    options={{ ...chartOptions, scales: { y: { min: 0, max: 100 } } }} // Limit Y-axis for percentage
                  />
                ) : (
                  <Alert message="No cache hit ratio data available for this range." type="info" />
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Slow Queries Count Over Time" bordered={false}>
                {metricsHistory.length > 0 ? (
                  <Line
                    data={generateChartData(metricsHistory, 'slow_queries_count', 'Slow Queries Count', 'rgb(255, 99, 132)')}
                    options={chartOptions}
                  />
                ) : (
                  <Alert message="No slow queries data available for this range." type="info" />
                )}
              </Card>
            </Col>
            {/* Add more metric charts here */}
          </Row>
        </Spin>
      )}
    </div>
  );
}

export default MetricsMonitorPage;