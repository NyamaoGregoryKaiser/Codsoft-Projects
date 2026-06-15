import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import domsApi from '../../api/domsApi';
import { useAuth } from '../../components/AuthProvider';

type RecommendationStatus = 'PENDING' | 'APPROVED' | 'IMPLEMENTED' | 'DISMISSED';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  status: RecommendationStatus;
  priority: number;
  analysisReport: {
    id: string;
    title: string;
  };
  targetDatabase: {
    id: string;
    name: string;
  };
  recommendedBy: {
    id: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    email: string;
  } | null;
  implementationDetails?: any;
  createdAt: string;
  updatedAt: string;
}

interface AnalysisReportMinimal {
  id: string;
  title: string;
}

interface TargetDatabaseMinimal {
  id: string;
  name: string;
}

interface UserMinimal {
  id: string;
  email: string;
}

const RecommendationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Recommendation>>({});
  const [analysisReports, setAnalysisReports] = useState<AnalysisReportMinimal[]>([]);
  const [targetDatabases, setTargetDatabases] = useState<TargetDatabaseMinimal[]>([]);
  const [users, setUsers] = useState<UserMinimal[]>([]);
  const { user } = useAuth(); // For recommendedById

  const priorityOptions = [
    { value: 0, label: 'Low' },
    { value: 1, label: 'Medium' },
    { value: 2, label: 'High' },
  ];

  const statusOptions: RecommendationStatus[] = ['PENDING', 'APPROVED', 'IMPLEMENTED', 'DISMISSED'];

  useEffect(() => {
    if (id) {
      fetchRecommendation(id);
    } else {
      setIsEditing(true); // New recommendation
      setFormData({
        title: '',
        description: '',
        priority: 0,
        status: 'PENDING',
        analysisReportId: '',
        targetDatabaseId: '',
        assignedToId: null,
      });
    }
    fetchRelatedData();
  }, [id]);

  const fetchRecommendation = async (recId: string) => {
    try {
      setLoading(true);
      const response = await domsApi.get(`/recommendations/${recId}`);
      setRecommendation(response.data);
      setFormData({
        ...response.data,
        analysisReportId: response.data.analysisReport.id,
        targetDatabaseId: response.data.targetDatabase.id,
        assignedToId: response.data.assignedTo?.id || null,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch recommendation details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [reportsRes, dbsRes, usersRes] = await Promise.all([
        domsApi.get('/analysis-reports?limit=100'), // Get all or enough for selection
        domsApi.get('/target-databases?limit=100'),
        domsApi.get('/users?limit=100'),
      ]);
      setAnalysisReports(reportsRes.data.map((r: any) => ({ id: r.id, title: r.title })));
      setTargetDatabases(dbsRes.data.map((db: any) => ({ id: db.id, name: db.name })));
      setUsers(usersRes.data.map((u: any) => ({ id: u.id, email: u.email })));
    } catch (err: any) {
      console.error('Failed to fetch related data:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const recDataToSend = {
        ...formData,
        recommendedById: user?.id, // Ensure recommendedBy ID is included
        priority: Number(formData.priority), // Ensure priority is number
      };

      if (id) {
        const response = await domsApi.put(`/recommendations/${id}`, recDataToSend);
        setRecommendation(response.data);
        setIsEditing(false);
      } else {
        const response = await domsApi.post('/recommendations', recDataToSend);
        navigate(`/recommendations/${response.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save recommendation');
    }
  };

  if (loading && id) return <div>Loading recommendation details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!recommendation && !isEditing) return <div>Recommendation not found.</div>;

  return (
    <div>
      <div className="page-header">
        <h2>{id ? (isEditing ? 'Edit Recommendation' : recommendation?.title) : 'Create New Recommendation'}</h2>
        <div>
          {id && (
            <button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel Edit' : 'Edit Recommendation'}
            </button>
          )}
          <button onClick={() => navigate('/recommendations')} style={{ marginLeft: '10px' }}>Back to List</button>
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
              required
            />
          </div>
          <div>
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status || ''}
              onChange={handleInputChange}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority">Priority:</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority || 0}
              onChange={handleInputChange}
            >
              {priorityOptions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="analysisReportId">Analysis Report:</label>
            <select
              id="analysisReportId"
              name="analysisReportId"
              value={formData.analysisReportId || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Select an Analysis Report</option>
              {analysisReports.map((reportItem) => (
                <option key={reportItem.id} value={reportItem.id}>
                  {reportItem.title}
                </option>
              ))}
            </select>
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
              <option value="">Select a Target Database</option>
              {targetDatabases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assignedToId">Assigned To:</label>
            <select
              id="assignedToId"
              name="assignedToId"
              value={formData.assignedToId || ''}
              onChange={handleInputChange}
            >
              <option value="">Unassigned</option>
              {users.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.email}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" style={{ marginTop: '20px' }}>Save Recommendation</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      ) : (
        <div className="detail-card">
          <div className="detail-item"><strong>Title:</strong> {recommendation?.title}</div>
          <div className="detail-item"><strong>Description:</strong> {recommendation?.description}</div>
          <div className="detail-item"><strong>Status:</strong> {recommendation?.status}</div>
          <div className="detail-item"><strong>Priority:</strong> {priorityOptions.find(p => p.value === recommendation?.priority)?.label}</div>
          <div className="detail-item"><strong>Analysis Report:</strong> <Link to={`/analysis-reports/${recommendation?.analysisReport.id}`}>{recommendation?.analysisReport.title}</Link></div>
          <div className="detail-item"><strong>Target Database:</strong> <Link to={`/target-databases/${recommendation?.targetDatabase.id}`}>{recommendation?.targetDatabase.name}</Link></div>
          <div className="detail-item"><strong>Recommended By:</strong> {recommendation?.recommendedBy.email}</div>
          <div className="detail-item"><strong>Assigned To:</strong> {recommendation?.assignedTo?.email || 'N/A'}</div>
          {recommendation?.implementationDetails && (
            <div className="detail-item">
              <strong>Implementation Details:</strong>
              <pre>{JSON.stringify(recommendation.implementationDetails, null, 2)}</pre>
            </div>
          )}
          <div className="detail-item"><strong>Created At:</strong> {new Date(recommendation?.createdAt || '').toLocaleDateString()}</div>
          <div className="detail-item"><strong>Last Updated:</strong> {new Date(recommendation?.updatedAt || '').toLocaleDateString()}</div>
        </div>
      )}
    </div>
  );
};

export default RecommendationDetail;
```