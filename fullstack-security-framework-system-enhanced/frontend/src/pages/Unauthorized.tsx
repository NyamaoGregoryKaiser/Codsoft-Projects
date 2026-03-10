import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>403 - Unauthorized Access</h1>
      <p style={styles.message}>You do not have permission to view this page.</p>
      <Link to="/dashboard" style={styles.link}>Go to Dashboard</Link>
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
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    color: '#343a40',
  },
  heading: {
    fontSize: '3em',
    marginBottom: '20px',
    color: '#dc3545',
  },
  message: {
    fontSize: '1.2em',
    marginBottom: '30px',
  },
  link: {
    fontSize: '1em',
    color: '#007bff',
    textDecoration: 'none',
    border: '1px solid #007bff',
    padding: '10px 20px',
    borderRadius: '5px',
    transition: 'background-color 0.3s, color 0.3s',
  },
};

export default Unauthorized;