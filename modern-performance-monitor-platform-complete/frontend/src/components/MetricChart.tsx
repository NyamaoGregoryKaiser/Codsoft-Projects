```typescript jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import moment from 'moment';
import { MetricResponseDTO } from '../api/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricChartProps {
  title: string;
  metrics: MetricResponseDTO[];
  metricType: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ title, metrics, metricType }) => {
  // Filter metrics for the specific type and sort by timestamp
  const filteredAndSortedMetrics = metrics
    .filter(m => m.metric_type === metricType)
    .sort((a, b) => moment(a.timestamp).valueOf() - moment(b.timestamp).valueOf());

  const data = {
    labels: filteredAndSortedMetrics.map(m => moment(m.timestamp).format('HH:mm:ss')),
    datasets: [
      {
        label: metricType.replace(/_/g, ' '),
        data: filteredAndSortedMetrics.map(m => m.value),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Value',
        },
        beginAtZero: true,
      },
    },
  };

  if (filteredAndSortedMetrics.length === 0) {
    return (
        <div className="card chart-container">
            <h3>{title}</h3>
            <p className="text-center">No data available for {metricType.replace(/_/g, ' ')}.</p>
        </div>
    );
  }

  return (
    <div className="card chart-container">
      <Line data={data} options={options} />
    </div>
  );
};

export default MetricChart;
```