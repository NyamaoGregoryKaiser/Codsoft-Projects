import React, { useState, useEffect } from 'react';

function ResultList({ task, authAxios, onClose, setError, setLoading }) {
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoadingResults(true);
      setResultsError(null);
      try {
        const response = await authAxios.get(`/results/task/${task.id}`);
        setResults(response.data);
      } catch (err) {
        console.error('Failed to fetch results:', err.response?.data || err.message);
        setResultsError(err.response?.data?.detail || 'Failed to fetch results.');
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [task.id, authAxios]);

  return (
    <div className="results-modal">
      <div className="results-modal-content">
        <button className="results-modal-close" onClick={onClose}>&times;</button>
        <h3>Results for Task: "{task.name}"</h3>
        {loadingResults ? (
          <p>Loading results...</p>
        ) : resultsError ? (
          <p className="error-message">{resultsError}</p>
        ) : results.length === 0 ? (
          <p>No results found for this task yet.</p>
        ) : (
          <div className="results-list">
            <h4>Latest Results ({results.length})</h4>
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <p><strong>Run At:</strong> {new Date(result.created_at).toLocaleString()}</p>
                  <p><strong>Status Code:</strong> {result.status_code}</p>
                  {result.error_message && <p><strong>Error:</strong> {result.error_message}</p>}
                  <p><strong>Scraped Data:</strong></p>
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultList;
```