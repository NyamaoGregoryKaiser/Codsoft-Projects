import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricDataPoint } from '../../types';
import moment from 'moment';

interface MetricChartProps {
  data: MetricDataPoint[];
  title: string;
  dataKey: string;
  unit?: string; // e.g., 'ms', '%'
  color?: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ data, title, dataKey, unit = '', color = '#3b82f6' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card-bg dark:bg-dark-card-bg p-4 rounded-lg shadow-sm h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data available for {title}.
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    return moment(tickItem).format('HH:mm');
  };

  const formatTooltip = (value: number, name: string, props: any) => {
    return [
      `${value.toFixed(unit === '%' ? 1 : 0)}${unit}`,
      `${moment(props.payload.timestamp).format('MMM Do HH:mm')}`,
    ];
  };

  return (
    <div className="bg-card-bg dark:bg-dark-card-bg p-4 rounded-lg shadow-sm h-80">
      <h3 className="text-lg font-semibold text-text dark:text-dark-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="calc(100% - 30px)">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0 dark:e5e7eb" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            minTickGap={30}
            angle={-30}
            textAnchor="end"
            height={60}
            stroke="#6b7280" // Gray-500
          />
          <YAxis stroke="#6b7280" />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }} formatter={formatTooltip} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricChart;
```

```