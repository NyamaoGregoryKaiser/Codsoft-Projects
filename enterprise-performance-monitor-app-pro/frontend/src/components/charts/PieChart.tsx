import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BreakdownData } from '../../types';

interface PieChartProps {
  data: BreakdownData[];
  title: string;
  dataKey: 'browser' | 'deviceType';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

const PieChart: React.FC<PieChartProps> = ({ data, title, dataKey }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-gray-500">No data available for {title}.</div>;
  }

  const formattedData = data
    .filter(item => item[dataKey] !== null && item[dataKey] !== undefined && item[dataKey] !== 'null') // Filter out null/undefined categories
    .map((item, index) => ({
      name: item[dataKey] || 'Unknown', // Use 'Unknown' for null/undefined
      value: item.averageValue,
      color: COLORS[index % COLORS.length],
    }));

  const total = formattedData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(2) : 0;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-sm text-sm text-gray-700">
          <p className="font-semibold">{data.name}</p>
          <p>Avg. Value: {data.value.toFixed(2)}</p>
          <p>Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={formattedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            // labelLine={false} // Disable label lines if labels are too crowded
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;