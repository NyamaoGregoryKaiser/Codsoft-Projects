import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MetricChartData } from '@types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  data: MetricChartData;
  title: string;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data, title }) => {
  const options: ChartOptions<'line'> = {
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
      tooltip: {
        mode: 'index',
        intersect: false,
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

  const chartData: ChartData<'line'> = {
    labels: data.labels,
    datasets: data.datasets.map(ds => ({
      ...ds,
      borderColor: ds.borderColor || '#4f46e5',
      backgroundColor: ds.backgroundColor || 'rgba(79, 70, 229, 0.1)',
      fill: ds.fill !== undefined ? ds.fill : true,
      tension: ds.tension !== undefined ? ds.tension : 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    }))
  };

  return (
    <div className="relative h-96 w-full p-4 bg-white rounded-lg shadow">
      {data.labels.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 italic">
          No chart data available.
        </div>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default ChartComponent;