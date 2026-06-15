import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import domsApi from '../../api/domsApi';
import { useAuth } from '../../components/AuthProvider';

interface TargetDatabase {
  id: string;
  name: string;
  type: string;
  description?: string;
  owner: {
    email: string;
  };
}

const TargetDatabasesList: React.FC = () => {
  const [databases, setDatabases] = useState<TargetDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchTargetDatabases();
  }, []);

  const fetchTargetDatabases = async () => {
    try {
      setLoading(true);
      const response = await domsApi.get('/target-databases');
      setDatabases(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch target databases');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this target database?')) {
      return;
    }
    try {
      await domsApi.delete(`/target-databases/${id}`);
      setDatabases(databases.filter((db) => db.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete target database');
    }
  };

  if (loading) return <div>Loading target databases...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Target Databases</h2>
        <button onClick={() => navigate('/target-databases/new')}>Add New Database</button>
      </div>

      {databases.length === 0 ? (
        <p>No target databases found. Add one to get started!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {databases.map((db) => (
              <tr key={db.id}>
                <td><Link to={`/target-databases/${db.id}`}>{db.name}</Link></td>
                <td>{db.type}</td>
                <td>{db.owner.email}</td>
                <td>
                  <button onClick={() => navigate(`/target-databases/${db.id}/edit`)} className="primary">Edit</button>
                  {isAdmin && ( // Only admins can delete for security
                    <button onClick={() => handleDelete(db.id)} className="danger">Delete</button>
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

export default TargetDatabasesList;
```