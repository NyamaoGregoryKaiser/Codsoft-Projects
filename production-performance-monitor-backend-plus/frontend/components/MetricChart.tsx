"use client";

import { Metric, MetricDataAggregation } from "@/types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // For time-series data
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Adapter for date-fns to handle time scales
import useSWR from "swr";
import { api } from "@/utils/api";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface MetricChartProps {
  metric: Metric;
}

const MetricChart: React.FC<MetricChartProps> = ({ metric }) => {
  const [timeRange, setTimeRange] = useState<string>("1h"); // e.g., "1h", "24h", "7d"
  const [intervalSeconds, setIntervalSeconds] = useState<number>(300); // 5 minutes default

  const now = new Date();
  let startTime = new Date();
  switch (timeRange) {
    case "1h":
      startTime.setHours(now.getHours() - 1);
      if (intervalSeconds > 300) setIntervalSeconds(60); // Max 1 min interval for 1h
      break;
    case "4h":
      startTime.setHours(now.getHours() - 4);
      if (intervalSeconds < 300) setIntervalSeconds(300); // Min 5 min interval for 4h
      break;
    case "24h":
      startTime.setDate(now.getDate() - 1);
      if (intervalSeconds < 600) setIntervalSeconds(600); // Min 10 min interval for 24h
      break;
    case "7d":
      startTime.setDate(now.getDate() - 7);
      if (intervalSeconds < 3600) setIntervalSeconds(3600); // Min 1 hour interval for 7d
      break;
  }

  // Ensure timestamps are ISO strings for API
  const startISO = startTime.toISOString();
  const endISO = now.toISOString();

  const { data: metricData, error, isLoading } = useSWR<MetricDataAggregation[]>(
    `/api/v1/metric_data/aggregated/${metric.id}?start_time=${startISO}&end_time=${endISO}&interval_seconds=${intervalSeconds}`,
    api.get
  );

  const chartData = {
    labels: metricData?.map(data => data.timestamp),
    datasets: [
      {
        label: `${metric.name} (Avg) ${metric.unit ? `(${metric.unit})` : ''}`,
        data: metricData?.map(data => data.average),
        borderColor: 'rgb(59, 130, 246)', // Tailwind primary-500
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: false,
      },
      // Optionally add min/max/sum datasets based on metric type
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${metric.name} Performance`,
        color: 'var(--textdark)', // dynamic text color
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: intervalSeconds < 3600 ? (intervalSeconds < 300 ? 'minute' : 'minute') : 'hour',
          tooltipFormat: 'MMM dd, HH:mm',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MMM dd, HH:mm',
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: 'var(--textdark)',
        },
        ticks: {
          color: 'var(--textdark)',
        },
        grid: {
          color: 'rgba(100,100,100,0.1)',
        }
      },
      y: {
        title: {
          display: true,
          text: metric.unit || 'Value',
          color: 'var(--textdark)',
        },
        beginAtZero: true, // adjust as needed for metric type
        ticks: {
          color: 'var(--textdark)',
        },
        grid: {
          color: 'rgba(100,100,100,0.1)',
        }
      },
    },
  };

  if (isLoading) return <div className="card h-96 flex items-center justify-center">Loading chart...</div>;
  if (error) return <div className="card h-96 flex items-center justify-center text-danger">Failed to load chart data.</div>;

  return (
    <div className="card p-6 h-96 flex flex-col">
      <div className="flex justify-end space-x-2 mb-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input w-auto p-1 text-sm bg-gray-50 dark:bg-gray-700"
        >
          <option value="1h">Last 1 Hour</option>
          <option value="4h">Last 4 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
        <select
          value={intervalSeconds}
          onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
          className="input w-auto p-1 text-sm bg-gray-50 dark:bg-gray-700"
        >
          <option value={60}>1 Min</option>
          <option value={300}>5 Mins</option>
          <option value={600}>10 Mins</option>
          <option value={1800}>30 Mins</option>
          <option value={3600}>1 Hour</option>
        </select>
      </div>
      <div className="flex-grow">
        {metricData && metricData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No data available for this metric in the selected time range.
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricChart;