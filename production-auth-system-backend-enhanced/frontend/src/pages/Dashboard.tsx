import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

const DashboardPage: React.FC = () => {
  const { user, logout, loading, getProfile } = useAuth();
  const [profileData, setProfileData] = useState(user);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile();
      if (data) {
        setProfileData(data);
      }
    };
    if (user && !profileData) { // Fetch only if user is logged in but profile data isn't set yet (e.g., after refresh)
      fetchProfile();
    }
  }, [user, profileData, getProfile]);


  if (loading || !profileData) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Welcome to the Dashboard, {profileData.email}!</h2>
      <div style={styles.card}>
        <p><strong>User ID:</strong> {profileData.id}</p>
        <p><strong>Email:</strong> {profileData.email}</p>
        <p><strong>Role:</strong> <span style={profileData.role === UserRole.ADMIN ? styles.adminRole : styles.userRole}>{profileData.role.toUpperCase()}</span></p>
        <p><strong>Email Verified:</strong> {profileData.isEmailVerified ? 'Yes' : 'No'}</p>
        <p><strong>Account Created:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
      </div>

      {profileData.role === UserRole.ADMIN && (
        <div style={styles.adminSection}>
          <h3>Admin Privileges</h3>
          <p>You have administrative access to this system.</p>
          <button style={styles.adminButton} onClick={() => alert('Accessing admin features...')}>Manage Users</button>
        </div>
      )}

      <button onClick={logout} disabled={loading} style={styles.logoutButton}>
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  },
  header: {
    textAlign: 'center',
    color: '#007bff',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '6px',
    marginBottom: '25px',
    border: '1px solid #e9ecef',
  },
  cardTitle: {
    color: '#007bff',
    marginBottom: '15px',
  },
  adminSection: {
    backgroundColor: '#ffeeba',
    border: '1px solid #ffc107',
    padding: '20px',
    borderRadius: '6px',
    marginBottom: '25px',
    textAlign: 'center',
  },
  adminRole: {
    fontWeight: 'bold',
    color: '#dc3545',
  },
  userRole: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  adminButton: {
    backgroundColor: '#ffc107',
    color: '#343a40',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px',
    fontWeight: 'bold',
  },
  logoutButton: {
    display: 'block',
    width: '100%',
    padding: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '30px',
    transition: 'background-color 0.2s ease',
  },
  logoutButtonHover: {
    backgroundColor: '#c82333',
  },
};

export default DashboardPage;