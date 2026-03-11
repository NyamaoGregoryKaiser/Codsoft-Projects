import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { Visualization } from '../types';
import { toast } from 'react-toastify';

interface ChartWrapperProps {
  visualization: Visualization;
  data: Record<string, any>[];
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ visualization, data }) => {
  const { type, config } = visualization;

  const chartConfig = useMemo(() => {
    try {
      return JSON.parse(config);
    } catch (e) {
      console.error("Invalid JSON config for visualization:", visualization.id, e);
      return {};
    }
  }, [config, visualization.id]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg">
        No data available to display this chart.
      </div>
    );
  }

  // Common properties for Nivo charts
  const commonProps = {
    animate: true,
    motionConfig: 'gentle',
    theme: {
      labels: { text: { fontSize: 12, fill: '#333' } },
      axis: {
        domain: { line: { stroke: '#d7d7d7' } },
        ticks: { line: { stroke: '#d7d7d7' } },
      },
      grid: { line: { stroke: '#f0f0f0' } },
    },
    ...chartConfig, // Spread custom configurations from the database
  };

  switch (type) {
    case 'BAR_CHART':
      return (
        <ResponsiveBar
          data={data}
          {...commonProps}
          keys={chartConfig.keys || Object.keys(data[0] || {}).slice(1, 4)} // Default to some keys if not provided
          indexBy={chartConfig.indexBy || Object.keys(data[0] || {})[0]} // Default to first key
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={{ scheme: 'nivo' }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: chartConfig.indexBy || Object.keys(data[0] || {})[0],
            legendPosition: 'middle',
            legendOffset: 32
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'value',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          enableLabel={false}
          role="application"
        />
      );
    case 'LINE_CHART':
        const lineData = chartConfig.lines && Array.isArray(chartConfig.lines)
            ? chartConfig.lines.map((lineKey: string) => ({
                id: lineKey,
                data: data.map(d => ({ x: d[chartConfig.xKey], y: d[lineKey] }))
              }))
            : [{
                id: 'value', // Default line if config not provided
                data: data.map(d => ({ x: d[Object.keys(d)[0]], y: d[Object.keys(d)[1]] }))
              }];

      return (
        <ResponsiveLine
          data={lineData}
          {...commonProps}
          margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: chartConfig.xKey || 'category',
            legendOffset: 36,
            legendPosition: 'middle'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'value',
            legendOffset: -40,
            legendPosition: 'middle'
          }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)'
            }
          ]}
        />
      );
    case 'PIE_CHART':
        const pieData = data.map((d, index) => ({
            id: d[chartConfig.idKey || Object.keys(d)[0]],
            label: d[chartConfig.idKey || Object.keys(d)[0]],
            value: d[chartConfig.valueKey || Object.keys(d)[1]],
            color: commonProps.colors?.[index] || `hsl(${index * 60}, 70%, 50%)` // Fallback color
        }));
      return (
        <ResponsivePie
          data={pieData}
          {...commonProps}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ scheme: 'nivo' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsTextColor="#333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: 50,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: '#999',
              itemDirection: 'left-to-right',
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ]}
        />
      );
    case 'TABLE':
      // Render as a simple HTML table
      if (data.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500">No data for table.</div>
        );
      }
      const columns = Object.keys(data[0]);
      return (
        <div className="overflow-auto h-full p-2">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          Unsupported visualization type: {type}
        </div>
      );
  }
};

export default ChartWrapper;