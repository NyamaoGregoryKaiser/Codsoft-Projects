import React from 'react';
import DatabaseList from '../components/Databases/DatabaseList';
import '../styles/pages.css';

const DatabasesPage = () => {
  return (
    <div className="page-container">
      <DatabaseList />
    </div>
  );
};

export default DatabasesPage;