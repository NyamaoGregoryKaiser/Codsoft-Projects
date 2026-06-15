import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import domsApi from '../../api/domsApi';
import { useAuth } from '../../components/AuthProvider';

type RecommendationStatus = 'PENDING' | 'APPROVED' | 'IMPLEMENTED' | 'DISMISSED';

interface Recommendation {
  id: string;
  title: string;
  status: RecommendationStatus;
  priority: number;
  targetDatabase: {
    name: string;
  };
  recommendedBy: {
    email: string;
  };
  assignedTo?: {
    email: string;
  } | null;
}

const RecommendationsList: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth(); // Assuming admins can delete/assign, regular users view/create

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await domsApi.get('/recommendations');
      setRecommendations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) {
      return;
    }
    try {
      await domsApi.delete(`/recommendations/${id}`);
      setRecommendations(recommendations.filter((rec) => rec.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete recommendation');
    }
  };

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Recommendations</h2>
        <button onClick={() => navigate('/recommendations/new')}>Create New Recommendation</button>
      </div>

      {recommendations.length === 0 ? (
        <p>No recommendations found. Create one to get started!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Target Database</th>
              <th>Recommended By</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec) => (
              <tr key={rec.id}>
                <td><Link to={`/recommendations/${rec.id}`}>{rec.title}</Link></td>
                <td>{rec.status}</td>
                <td>{rec.priority === 2 ? 'High' : rec.priority === 1 ? 'Medium' : 'Low'}</td>
                <td>{rec.targetDatabase.name}</td>
                <td>{rec.recommendedBy.email}</td>
                <td>{rec.assignedTo?.email || 'N/A'}</td>
                <td>
                  <button onClick={() => navigate(`/recommendations/${rec.id}/edit`)} className="primary">Edit</button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(rec.id)} className="danger">Delete</button>
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

export default RecommendationsList;
```