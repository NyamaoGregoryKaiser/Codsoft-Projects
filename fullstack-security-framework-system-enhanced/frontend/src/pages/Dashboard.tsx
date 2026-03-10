import React from 'react';
import { useAuth } from 'hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      alert('Failed to log out.');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Welcome to your Dashboard, {user?.name}!</h2>
      <p style={styles.userInfo}>Your role: {user?.role}</p>

      <div style={styles.buttonGroup}>
        <button onClick={() => navigate('/products')} style={styles.navButton}>View Products</button>
        {hasRole('admin') && (
          <button onClick={() => navigate('/users')} style={styles.navButton}>Manage Users</button>
        )}
      </div>

      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    margin: '50px auto',
    textAlign: 'center',
  },
  header: {
    fontSize: '2.5em',
    color: '#333',
    marginBottom: '20px',
  },
  userInfo: {
    fontSize: '1.2em',
    color: '#555',
    marginBottom: '30px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    marginBottom: '40px',
  },
  navButton: {
    padding: '12px 25px',
    fontSize: '1.1em',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  logoutButton: {
    padding: '10px 20px',
    fontSize: '1em',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};


export default Dashboard;