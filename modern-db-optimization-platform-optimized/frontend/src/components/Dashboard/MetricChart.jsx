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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MetricChart = ({ title, labels, dataPoints, dataLabel, unit = '' }) => {
  const data = {
    labels: labels,
    datasets: [
      {
        label: dataLabel,
        data: dataPoints,
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.6)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            color: 'var(--text-color-primary)'
        }
      },
      title: {
        display: true,
        text: title,
        color: 'var(--text-color-primary)'
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: 'var(--text-color-secondary)'
        },
        ticks: {
            color: 'var(--text-color-secondary)'
        },
        grid: {
            color: 'var(--border-color)'
        }
      },
      y: {
        title: {
          display: true,
          text: unit,
          color: 'var(--text-color-secondary)'
        },
        ticks: {
            color: 'var(--text-color-secondary)'
        },
        grid: {
            color: 'var(--border-color)'
        }
      },
    },
  };

  return (
    <div className="chart-container">
      <Line data={data} options={options} />
    </div>
  );
};

export default MetricChart;