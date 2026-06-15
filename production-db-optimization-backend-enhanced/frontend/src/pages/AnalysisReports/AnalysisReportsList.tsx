import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import domsApi from '../../api/domsApi';
import { useAuth } from '../../components/AuthProvider';

interface AnalysisReport {
  id: string;
  title: string;
  reportDate: string;
  targetDatabase: {
    id: string;
    name: string;
  };
  analyst: {
    email: string;
  };
}

const AnalysisReportsList: React.FC = () => {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth(); // Assuming admins can delete, regular users view/create

  useEffect(() => {
    fetchAnalysisReports();
  }, []);

  const fetchAnalysisReports = async () => {
    try {
      setLoading(true);
      const response = await domsApi.get('/analysis-reports');
      setReports(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analysis reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis report?')) {
      return;
    }
    try {
      await domsApi.delete(`/analysis-reports/${id}`);
      setReports(reports.filter((report) => report.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete analysis report');
    }
  };

  if (loading) return <div>Loading analysis reports...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Analysis Reports</h2>
        <button onClick={() => navigate('/analysis-reports/new')}>Create New Report</button>
      </div>

      {reports.length === 0 ? (
        <p>No analysis reports found. Create one to get started!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Target Database</th>
              <th>Analyst</th>
              <th>Report Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td><Link to={`/analysis-reports/${report.id}`}>{report.title}</Link></td>
                <td><Link to={`/target-databases/${report.targetDatabase.id}`}>{report.targetDatabase.name}</Link></td>
                <td>{report.analyst.email}</td>
                <td>{new Date(report.reportDate).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate(`/analysis-reports/${report.id}/edit`)} className="primary">Edit</button>
                  {isAdmin && ( // Only admins can delete for security
                    <button onClick={() => handleDelete(report.id)} className="danger">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AnalysisReportsList;
```