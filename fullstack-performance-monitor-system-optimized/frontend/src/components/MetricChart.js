```javascript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import './MetricChart.css';

const MetricChart = ({ data, metricType, title, color = '#8884d8' }) => {
  if (!data || data.length === 0) {
    return <div className="metric-chart-container no-data">No data available for {title} yet.</div>;
  }

  // Format data for Recharts: { timestamp: "HH:mm", value: X }
  const formattedData = data.map(item => ({
    ...item,
    timestamp: moment(item.timestamp).format('HH:mm - MMM D'),
  }));

  const valueFormatter = (value) => {
    switch (metricType) {
      case 'cpu': return `${(value * 100).toFixed(1)}%`;
      case 'memory': return `${value.toFixed(0)} MB`;
      case 'request_latency': return `${value.toFixed(0)} ms`;
      case 'error_rate': return `${value.toFixed(1)}%`;
      default: return value.toFixed(2);
    }
  };

  return (
    <div className="metric-chart-container">
      <h4 className="metric-chart-title">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="timestamp" />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip labelFormatter={(label) => `Time: ${label}`} formatter={(value) => [valueFormatter(value), 'Value']} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricChart;
```