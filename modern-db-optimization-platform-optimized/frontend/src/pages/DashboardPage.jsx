import React, { useState, useEffect } from 'react';
import DashboardSummary from '../components/Dashboard/DashboardSummary';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import * as dashboardApi from '../api/dashboard';
import '../styles/dashboard.css'; // Shared dashboard styles

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardApi.getDashboardSummary();
        setSummaryData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();

    // Auto-refresh summary data every minute
    const interval = setInterval(fetchSummary, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <h2>DB Health Monitor Dashboard</h2>
      <DashboardSummary summaryData={summaryData} />
    </div>
  );
};

export default DashboardPage;