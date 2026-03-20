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
import dayjs from 'dayjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MetricChart = ({ title, data, labels, metricKey, unit = '', color = '#3B82F6' }) => {
  const chartData = {
    labels: labels.map(label => dayjs(label).format('HH:mm')),
    datasets: [
      {
        label: title,
        data: data.map(item => item[metricKey]),
        borderColor: color,
        backgroundColor: `${color}40`, // 25% opacity
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + unit;
            }
            return label;
          }
        }
      }
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
          text: title + unit,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-80"> {/* Fixed height for responsiveness */}
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MetricChart;
```

#### `frontend/src/pages/LoginPage.js`
```javascript