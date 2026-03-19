```typescript
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';

interface EChartComponentProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
}

const EChartComponent: React.FC<EChartComponentProps> = ({ option, style, className }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
      chartInstance.current.setOption(option, true); // `true` for not merging (replaces all options)
    }

    // Resize observer to make charts responsive
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
    };
  }, [option]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '100%', minHeight: '300px', ...style }}
      className={className}
    />
  );
};

export default EChartComponent;
```