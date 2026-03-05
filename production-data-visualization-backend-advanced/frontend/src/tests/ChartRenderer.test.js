import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ChartRenderer from '../components/ChartRenderer';
import apiClient from '../api/apiClient'; // Mock this API client
import '@testing-library/jest-dom';
import ReactECharts from 'echarts-for-react';

// Mock apiClient
jest.mock('../api/apiClient');

// Mock echarts-for-react to prevent actual chart rendering in tests
jest.mock('echarts-for-react', () => {
  const MockReactECharts = ({ option, style, ref, ...props }) => (
    <div data-testid="echarts-mock" style={style} {...props}>
      {JSON.stringify(option)}
    </div>
  );
  return MockReactECharts;
});


describe('ChartRenderer', () => {
  beforeEach(() => {
    apiClient.get.mockClear();
  });

  test('renders loading spinner initially', () => {
    apiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolve
    render(<ChartRenderer chartId="123" />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Chakra UI Spinner has role 'status'
    expect(screen.getByText(/loading chart\.\.\./i)).toBeInTheDocument();
  });

  test('renders chart with data on successful API call', async () => {
    const mockChartId = 'chart-1';
    const mockChartData = {
      chartConfig: {
        title: { text: 'My Test Chart' },
        xAxis: { type: 'category', data: ['Jan', 'Feb'] },
        yAxis: { type: 'value' },
        series: [{ name: 'Sales', type: 'bar', data: [] }],
      },
      data: [{ month: 'Jan', sales: 100 }, { month: 'Feb', sales: 150 }],
    };
    apiClient.get.mockResolvedValueOnce({ data: { data: mockChartData } });

    render(<ChartRenderer chartId={mockChartId} title="Custom Chart Title" />);

    expect(screen.getByText('Custom Chart Title')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(`/charts/${mockChartId}/data`);
      expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
      // Verify that data was correctly mapped to the options
      const renderedOptions = JSON.parse(screen.getByTestId('echarts-mock').textContent);
      expect(renderedOptions.series[0].data).toEqual([100, 150]); // Assuming default mapping from seed.js
      expect(renderedOptions.xAxis.data).toEqual(['Jan', 'Feb']); // Assuming default mapping from seed.js
      expect(renderedOptions.title.text).toBe('My Test Chart');
    });
  });

  test('renders pie chart with correct data mapping', async () => {
    const mockChartId = 'pie-chart-1';
    const mockPieChartData = {
      chartConfig: {
        title: { text: 'Pie Chart' },
        series: [{ name: 'Revenue', type: 'pie', data: [] }],
      },
      data: [{ name: 'Electronics', value: 500 }, { name: 'Clothing', value: 300 }],
    };
    apiClient.get.mockResolvedValueOnce({ data: { data: mockPieChartData } });

    render(<ChartRenderer chartId={mockPieChartId} />);

    await waitFor(() => {
      const renderedOptions = JSON.parse(screen.getByTestId('echarts-mock').textContent);
      expect(renderedOptions.series[0].type).toBe('pie');
      expect(renderedOptions.series[0].data).toEqual(mockPieChartData.data);
    });
  });


  test('renders error message on API failure', async () => {
    const errorMessage = 'Failed to fetch chart data.';
    apiClient.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    render(<ChartRenderer chartId="error-chart" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error Loading Chart')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('renders alert when no chart ID is provided', async () => {
    render(<ChartRenderer chartId={null} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('No chart ID provided.')).toBeInTheDocument();
    });
  });
});