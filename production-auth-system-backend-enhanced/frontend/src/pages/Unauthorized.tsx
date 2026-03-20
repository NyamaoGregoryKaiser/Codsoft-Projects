import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>403 - Unauthorized Access</h2>
      <p style={styles.message}>You do not have the necessary permissions to view this page.</p>
      <Link to="/dashboard" style={styles.link}>Go to Dashboard</Link>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '30px',
    textAlign: 'center',
    border: '1px solid #dc3545',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(220, 53, 69, 0.1)',
    backgroundColor: '#fff3cd',
    fontFamily: 'Arial, sans-serif',
    color: '#721c24',
  },
  header: {
    color: '#dc3545',
    marginBottom: '20px',
  },
  message: {
    fontSize: '18px',
    marginBottom: '25px',
  },
  link: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  linkHover: {
    backgroundColor: '#c82333',
  },
};

export default UnauthorizedPage;