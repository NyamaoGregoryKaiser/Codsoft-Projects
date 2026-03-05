import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Alert, Select, Button, notification } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { getConnections } from '../api/connections';
import { getLiveMetrics, recordMetrics } from '../api/metrics';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const { Option } = Select;

function DashboardPage() {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const fetchConnections = async () => {
    try {
      const data = await getConnections();
      setConnections(data);
      if (data.length > 0) {
        setSelectedConnection(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load connections.');
      setLoading(false);
    }
  };

  const fetchLiveMetrics = async (connectionId) => {
    if (!connectionId) return;
    setLoading(true);
    try {
      const data = await getLiveMetrics(connectionId);
      setLiveMetrics(data);
      // For simplicity, generate some dummy historical data for the chart on live metric fetch
      // In a real scenario, you'd fetch from getMetricsHistory
      const newLabels = [...chartData.labels, new Date().toLocaleTimeString()];
      const newActiveConnections = [...(chartData.datasets[0]?.data || []), data.active_connections];
      const newSlowQueries = [...(chartData.datasets[1]?.data || []), data.slow_queries_count];

      if (newLabels.length > 10) { // Keep last 10 points
        newLabels.shift();
        newActiveConnections.shift();
        newSlowQueries.shift();
      }

      setChartData({
        labels: newLabels,
        datasets: [
          {
            label: 'Active Connections',
            data: newActiveConnections,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
          },
          {
            label: 'Slow Queries',
            data: newSlowQueries,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1,
          },
        ],
      });
    } catch (err) {
      setError(`Failed to load live metrics: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRecord = async () => {
    if (!selectedConnection) {
      notification.warn({ message: 'Please select a connection first.' });
      return;
    }
    setLoading(true);
    try {
      await recordMetrics(selectedConnection);
      notification.success({ message: 'Metrics recorded successfully!' });
      await fetchLiveMetrics(selectedConnection); // Refresh live metrics
    } catch (err) {
      notification.error({ message: 'Failed to record metrics', description: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchLiveMetrics(selectedConnection);
      const interval = setInterval(() => fetchLiveMetrics(selectedConnection), 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [selectedConnection]);

  if (loading && !liveMetrics) return <Spin tip="Loading dashboard data..." size="large" />;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;
  if (connections.length === 0) return <Alert message="No connections found. Please add a database connection to start monitoring." type="info" showIcon />;

  const getMetricChangeIndicator = (current, previous) => {
    if (previous === undefined || previous === null || current === previous) return null;
    if (current > previous) {
      return <ArrowUpOutlined style={{ color: 'red' }} />;
    }
    return <ArrowDownOutlined style={{ color: 'green' }} />;
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Live Metrics Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2>Dashboard Overview</h2>
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
            <Button onClick={handleManualRecord} loading={loading}>Record Metrics Now</Button>
          </Space>
        </Col>
      </Row>

      {selectedConnection && liveMetrics ? (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="Active Connections"
                  value={liveMetrics.active_connections}
                  precision={0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<DatabaseOutlined />}
                  suffix={getMetricChangeIndicator(liveMetrics.active_connections, chartData.datasets[0]?.data.slice(-2,-1)[0])}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="Total Connections"
                  value={liveMetrics.total_connections}
                  precision={0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="Database Size"
                  value={(liveMetrics.database_size_bytes / (1024 * 1024 * 1024)).toFixed(2)}
                  precision={2}
                  valueStyle={{ color: '#0050b3' }}
                  suffix="GB"
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="Cache Hit Ratio"
                  value={liveMetrics.cache_hit_ratio_percent}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                  suffix="%"
                  prefix={<ArrowUpOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 24 }}>
             <Col span={6}>
              <Card bordered={false}>
                <Statistic
                  title="Slow Queries (Last Minute)"
                  value={liveMetrics.slow_queries_count}
                  precision={0}
                  valueStyle={{ color: '#d46b08' }}
                  prefix={<ClockCircleOutlined />}
                  suffix={getMetricChangeIndicator(liveMetrics.slow_queries_count, chartData.datasets[1]?.data.slice(-2,-1)[0])}
                />
              </Card>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <Card title="Recent Metrics Trend" bordered={false}>
                {chartData.labels.length > 0 ? (
                  <Line data={chartData} options={options} />
                ) : (
                  <Alert message="No historical chart data available yet." type="info" showIcon />
                )}
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Alert message="Please select a database connection to view its dashboard." type="info" showIcon />
      )}
    </div>
  );
}

export default DashboardPage;