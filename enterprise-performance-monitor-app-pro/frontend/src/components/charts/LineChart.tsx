import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import dayjs from 'dayjs';
import { MetricTrendData } from '../../types';

interface LineChartProps {
  data: MetricTrendData[];
  dataKey: string; // The key for the value in your data (e.g., 'averageValue')
  xDataKey: string; // The key for the x-axis (e.g., 'date')
  title: string;
  yAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, dataKey, xDataKey, title, yAxisLabel }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-gray-500">No data available for {title}.</div>;
  }

  const formatXAxis = (tickItem: string) => {
    return dayjs(tickItem).format('MMM D');
  };

  const formatTooltip = (value: number, name: string) => {
    return [`${value.toFixed(2)} ${yAxisLabel || ''}`, name];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey={xDataKey}
            tickFormatter={formatXAxis}
            minTickGap={30}
            angle={-30}
            textAnchor="end"
            height={70}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            stroke="#6b7280"
          />
          <Tooltip formatter={formatTooltip} />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name={title.replace(' Trend', '')}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;