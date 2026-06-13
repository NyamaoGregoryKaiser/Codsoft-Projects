```typescript
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  PieController,
  ScatterController,
  DoughnutController,
} from 'chart.js';
import { Bar, Line, Pie, Chart as ReactChartJsChart } from 'react-chartjs-2';
import { Visualization, ChartType, VisualizationConfig } from '../types/Visualization';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  PieController,
  ScatterController,
  DoughnutController, // Added Doughnut for potential future use or if Pie is rendered as Doughnut
);

interface ChartRendererProps {
  visualization: Visualization;
  data: any[]; // The actual data from the data source
}

const generateChartData = (visualization: Visualization, rawData: any[]) => {
  const { chart_type, config } = visualization;
  const {
    label_column,
    data_column,
    x_axis,
    y_axis,
    backgroundColor,
    borderColor,
    borderWidth = 1,
    title,
    ...restConfig
  } = config as VisualizationConfig;

  // Ensure data exists and is an array
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = label_column ? rawData.map(row => row[label_column]) : rawData.map((_, i) => `Item ${i + 1}`);
  const dataValues = data_column ? rawData.map(row => row[data_column]) : [];

  let datasets = [];
  let chartJsType: ChartType | 'scatter' | 'doughnut' = chart_type; // Explicitly map ChartType to ChartJS type

  switch (chart_type) {
    case ChartType.Bar:
    case ChartType.Line:
      datasets = [
        {
          label: config.data_column || 'Value', // Use data_column as default label for dataset
          data: dataValues,
          backgroundColor: backgroundColor || 'rgba(75, 192, 192, 0.6)',
          borderColor: borderColor || 'rgba(75, 192, 192, 1)',
          borderWidth: borderWidth,
          ...(chart_type === ChartType.Line && { fill: config.fill !== undefined ? config.fill : false }),
          ...restConfig
        }
      ];
      break;
    case ChartType.Pie:
      datasets = [
        {
          label: config.data_column || 'Count',
          data: dataValues,
          backgroundColor: backgroundColor || [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: borderColor || [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: borderWidth,
          ...restConfig
        }
      ];
      break;
    case ChartType.Scatter:
        chartJsType = 'scatter';
        datasets = [{
            label: config.data_column || 'Data Points',
            data: rawData.map(row => ({ x: row[x_axis as string], y: row[y_axis as string] })),
            backgroundColor: backgroundColor || 'rgba(75, 192, 192, 0.6)',
            borderColor: borderColor || 'rgba(75, 192, 192, 1)',
            ...restConfig
        }];
        break;
    default:
      console.warn(`Unsupported chart type: ${chart_type}`);
      return { labels: [], datasets: [] };
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || 'Chart Title',
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    ...restConfig.chartOptions // Allow passing direct Chart.js options
  };

  if (chart_type !== ChartType.Pie && chart_type !== ChartType.Scatter) {
    options.scales = {
      x: {
        title: {
          display: !!x_axis,
          text: x_axis || ''
        }
      },
      y: {
        title: {
          display: !!y_axis,
          text: y_axis || ''
        }
      }
    };
  } else if (chart_type === ChartType.Scatter) {
    options.scales = {
      x: {
        type: 'linear' as const, // Scatter plots typically use linear scales for both axes
        position: 'bottom' as const,
        title: {
          display: !!x_axis,
          text: x_axis || ''
        }
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: !!y_axis,
          text: y_axis || ''
        }
      }
    };
  }


  return {
    data: { labels, datasets },
    options,
    chartJsType // Return ChartJS type for dynamic rendering
  };
};

const ChartRenderer: React.FC<ChartRendererProps> = ({ visualization, data }) => {
  const { data: chartData, options, chartJsType } = generateChartData(visualization, data);

  if (!chartData || chartData.labels.length === 0 && chartData.datasets.length === 0) {
    return <div className="chart-placeholder">No data or invalid configuration to render chart.</div>;
  }

  switch (chartJsType) {
    case ChartType.Bar:
      return <Bar data={chartData} options={options} />;
    case ChartType.Line:
      return <Line data={chartData} options={options} />;
    case ChartType.Pie:
      return <Pie data={chartData} options={options} />;
    case ChartType.Scatter:
      // ChartJS scatter uses 'scatter' type directly
      return <ReactChartJsChart type='scatter' data={chartData} options={options} />;
    default:
      return <div className="chart-placeholder">Unsupported chart type: {visualization.chart_type}</div>;
  }
};

export default ChartRenderer;
```