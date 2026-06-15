import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import domsApi from '../../api/domsApi';
import { useAuth } from '../../components/AuthProvider';

interface SlowQuery {
  query: string;
  executionTimeMs: number;
  count?: number;
}

interface AnalysisReport {
  id: string;
  title: string;
  description?: string;
  reportDate: string;
  targetDatabase: {
    id: string;
    name: string;
  };
  analyst: {
    id: string;
    email: string;
  };
  slowQueries?: SlowQuery[];
  recommendations?: any[]; // Simplified for now
  createdAt: string;
  updatedAt: string;
}

interface TargetDatabaseMinimal {
  id: string;
  name: string;
}

const AnalysisReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AnalysisReport>>({});
  const [targetDatabases, setTargetDatabases] = useState<TargetDatabaseMinimal[]>([]);
  const { user } = useAuth(); // For analystId

  useEffect(() => {
    if (id) {
      fetchReport(id);
    } else {
      setIsEditing(true); // If no ID, it's a new report
      setFormData({
        title: '',
        description: '',
        targetDatabaseId: '',
        slowQueries: [],
        reportDate: new Date().toISOString().split('T')[0], // Default to today
      });
    }
    fetchTargetDatabases();
  }, [id]);

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      const response = await domsApi.get(`/analysis-reports/${reportId}`);
      setReport(response.data);
      setFormData({
        ...response.data,
        targetDatabaseId: response.data.targetDatabase.id, // For dropdown selection
        reportDate: new Date(response.data.reportDate).toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analysis report details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTargetDatabases = async () => {
    try {
      const response = await domsApi.get('/target-databases');
      setTargetDatabases(response.data.map((db: any) => ({ id: db.id, name: db.name })));
    } catch (err: any) {
      console.error('Failed to fetch target databases:', err);
      // Don't block report loading if this fails, but show error
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlowQueryChange = (index: number, field: keyof SlowQuery, value: string | number) => {
    const updatedQueries = [...(formData.slowQueries || [])];
    updatedQueries[index] = {
      ...updatedQueries[index],
      [field]: field === 'query' ? value : Number(value),
    };
    setFormData((prev) => ({ ...prev, slowQueries: updatedQueries }));
  };

  const addSlowQuery = () => {
    setFormData((prev) => ({
      ...prev,
      slowQueries: [...(prev.slowQueries || []), { query: '', executionTimeMs: 0 }],
    }));
  };

  const removeSlowQuery = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      slowQueries: (prev.slowQueries || []).filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const reportDataToSend = {
        ...formData,
        analystId: user?.id, // Ensure analyst ID is included
        reportDate: formData.reportDate ? new Date(formData.reportDate).toISOString() : new Date().toISOString(),
      };

      if (id) {
        const response = await domsApi.put(`/analysis-reports/${id}`, reportDataToSend);
        setReport(response.data);
        setIsEditing(false);
      } else {
        const response = await domsApi.post('/analysis-reports', reportDataToSend);
        navigate(`/analysis-reports/${response.data.id}`); // Navigate to detail page of new report
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save analysis report');
    }
  };

  if (loading && id) return <div>Loading analysis report details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!report && !isEditing) return <div>Analysis Report not found.</div>;

  return (
    <div>
      <div className="page-header">
        <h2>{id ? (isEditing ? 'Edit Analysis Report' : report?.title) : 'Create New Analysis Report'}</h2>
        <div>
          {id && (
            <button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel Edit' : 'Edit Report'}
            </button>
          )}
          <button onClick={() => navigate('/analysis-reports')} style={{ marginLeft: '10px' }}>Back to List</button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="targetDatabaseId">Target Database:</label>
            <select
              id="targetDatabaseId"
              name="targetDatabaseId"
              value={formData.targetDatabaseId || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Database</option>
              {targetDatabases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reportDate">Report Date:</label>
            <input
              type="date"
              id="reportDate"
              name="reportDate"
              value={formData.reportDate || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <h3>Slow Queries</h3>
          {(formData.slowQueries || []).map((sq, index) => (
            <div key={index} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
              <div>
                <label htmlFor={`query-${index}`}>Query:</label>
                <input
                  type="text"
                  id={`query-${index}`}
                  name="query"
                  value={sq.query}
                  onChange={(e) => handleSlowQueryChange(index, 'query', e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor={`executionTimeMs-${index}`}>Execution Time (ms):</label>
                <input
                  type="number"
                  id={`executionTimeMs-${index}`}
                  name="executionTimeMs"
                  value={sq.executionTimeMs}
                  onChange={(e) => handleSlowQueryChange(index, 'executionTimeMs', e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor={`count-${index}`}>Count:</label>
                <input
                  type="number"
                  id={`count-${index}`}
                  name="count"
                  value={sq.count || ''}
                  onChange={(e) => handleSlowQueryChange(index, 'count', e.target.value)}
                />
              </div>
              <button type="button" className="danger" onClick={() => removeSlowQuery(index)}>Remove Query</button>
            </div>
          ))}
          <button type="button" onClick={addSlowQuery}>Add Slow Query</button>

          <button type="submit" style={{ marginTop: '20px' }}>Save Report</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      ) : (
        <div className="detail-card">
          <div className="detail-item"><strong>Title:</strong> {report?.title}</div>
          <div className="detail-item"><strong>Description:</strong> {report?.description || 'N/A'}</div>
          <div className="detail-item"><strong>Target Database:</strong> {report?.targetDatabase?.name}</div>
          <div className="detail-item"><strong>Analyst:</strong> {report?.analyst?.email}</div>
          <div className="detail-item"><strong>Report Date:</strong> {new Date(report?.reportDate || '').toLocaleDateString()}</div>
          <div className="detail-item"><strong>Created At:</strong> {new Date(report?.createdAt || '').toLocaleDateString()}</div>
          <div className="detail-item"><strong>Last Updated:</strong> {new Date(report?.updatedAt || '').toLocaleDateString()}</div>

          <h3>Slow Queries Identified:</h3>
          {report?.slowQueries && report.slowQueries.length > 0 ? (
            <ul>
              {report.slowQueries.map((sq, index) => (
                <li key={index}>
                  <strong>Query:</strong> <code>{sq.query}</code> <br />
                  <strong>Execution Time:</strong> {sq.executionTimeMs} ms <br />
                  <strong>Count:</strong> {sq.count || 'N/A'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No slow queries recorded in this report.</p>
          )}

          <h3>Associated Recommendations:</h3>
          {report?.recommendations && report.recommendations.length > 0 ? (
            <ul>
              {report.recommendations.map((rec) => (
                <li key={rec.id}><Link to={`/recommendations/${rec.id}`}>{rec.title} ({rec.status})</Link></li>
              ))}
            </ul>
          ) : (
            <p>No recommendations associated with this report yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisReportDetail;
```