import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get('/performance_data');
      setData(response.data);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Performance Monitoring</h1>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.timestamp}</td>
              <td>{item.metric}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;