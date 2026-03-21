```javascript
import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

const PlotlyChart = ({ data, layout, config, style }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      Plotly.newPlot(chartRef.current, data, layout, config);
    }
  }, [data, layout, config]);

  return <div ref={chartRef} style={style || { width: '100%', height: '400px' }} />;
};

export default PlotlyChart;
```