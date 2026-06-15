import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import domsApi from '../../api/domsApi';
import { useAuth } from '../../components/AuthProvider';

interface TargetDatabase {
  id: string;
  name: string;
  type: string;
  connectionString?: string;
  description?: string;
  owner: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const TargetDatabaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [database, setDatabase] = useState<TargetDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<TargetDatabase>>({});
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (id) {
      fetchDatabase(id);
    }
  }, [id]);

  const fetchDatabase = async (dbId: string) => {
    try {
      setLoading(true);
      const response = await domsApi.get(`/target-databases/${dbId}`);
      setDatabase(response.data);
      setFormData(response.data); // Initialize form data with existing database details
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch target database details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (id) {
        const response = await domsApi.put(`/target-databases/${id}`, formData);
        setDatabase(response.data);
        setIsEditing(false);
      } else {
        // This case should be handled by /new route, but for robustness:
        await domsApi.post('/target-databases', formData);
        navigate('/target-databases');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save database');
    }
  };

  if (loading) return <div>Loading target database details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!database) return <div>Database not found.</div>;

  return (
    <div>
      <div className="page-header">
        <h2>{isEditing ? 'Edit Target Database' : database.name}</h2>
        <div>
          {isAdmin && (
            <button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel Edit' : 'Edit Database'}
            </button>
          )}
          <button onClick={() => navigate('/target-databases')} style={{marginLeft: '10px'}}>Back to List</button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label htmlFor="type">Type:</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label htmlFor="connectionString">Connection String (Optional):</label>
            <input
              type="text"
              id="connectionString"
              name="connectionString"
              value={formData.connectionString || ''}
              onChange={handleInputChange}
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
          <button type="submit">Save Changes</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      ) : (
        <div className="detail-card">
          <div className="detail-item"><strong>Name:</strong> {database.name}</div>
          <div className="detail-item"><strong>Type:</strong> {database.type}</div>
          <div className="detail-item"><strong>Description:</strong> {database.description || 'N/A'}</div>
          <div className="detail-item"><strong>Owner:</strong> {database.owner.email}</div>
          <div className="detail-item"><strong>Connection String:</strong> {database.connectionString || 'Not provided'}</div>
          <div className="detail-item"><strong>Created At:</strong> {new Date(database.createdAt).toLocaleDateString()}</div>
          <div className="detail-item"><strong>Last Updated:</strong> {new Date(database.updatedAt).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  );
};

export default TargetDatabaseDetail;
```