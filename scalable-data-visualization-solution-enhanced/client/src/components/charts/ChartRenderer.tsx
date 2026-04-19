```typescript
import React, { useMemo } from 'react';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { ChartType, Visualization } from 'api/api';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

interface ChartRendererProps {
  visualization: Visualization;
  chartData: any; // Data prepared by backend for Chart.js or array for table
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ visualization, chartData }) => {
  const { chartType, config } = visualization;

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false, // Allow charts to fill container
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: config.title || visualization.name,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    // Specific scales for different chart types
    scales: {
      x: {
        display: chartType !== ChartType.PIE && chartType !== ChartType.DOUGHNUT,
        title: {
          display: true,
          text: config.labelsField,
        },
      },
      y: {
        display: chartType !== ChartType.PIE && chartType !== ChartType.DOUGHNUT,
        title: {
          display: true,
          text: config.dataField,
        },
        beginAtZero: true,
      },
    },
  }), [chartType, config.title, config.labelsField, config.dataField, visualization.name]);

  if (!chartData || (Array.isArray(chartData) && chartData.length === 0) || (!Array.isArray(chartData) && !chartData.datasets)) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
        No data available for this visualization.
      </Typography>
    );
  }

  // Special handling for 'table' chart type
  if (chartType === ChartType.TABLE) {
    const tableData = chartData as any[];
    if (tableData.length === 0) {
      return (
        <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
          No data available for this table.
        </Typography>
      );
    }
    const headers = Object.keys(tableData[0]);
    return (
      <TableContainer component={Paper} sx={{ maxHeight: '100%', overflow: 'auto' }}>
        <Typography variant="h6" sx={{ p: 2 }}>{config.title || visualization.name}</Typography>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header} sx={{ fontWeight: 'bold' }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={`${index}-${header}`}>{row[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Render actual charts
  switch (chartType) {
    case ChartType.BAR:
      return <Bar data={chartData} options={options} />;
    case ChartType.LINE:
      return <Line data={chartData} options={options} />;
    case ChartType.PIE:
      return <Pie data={chartData} options={options} />;
    case ChartType.DOUGHNUT:
      return <Doughnut data={chartData} options={options} />;
    case ChartType.SCATTER:
      return <Scatter data={chartData} options={options} />;
    default:
      return (
        <Typography variant="body1" color="error" sx={{ p: 2 }}>
          Unsupported chart type: {chartType}
        </Typography>
      );
  }
};

export default ChartRenderer;
```