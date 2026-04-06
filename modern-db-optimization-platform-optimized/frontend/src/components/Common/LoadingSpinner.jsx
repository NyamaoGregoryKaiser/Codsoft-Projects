import React from 'react';
import '../../styles/loadingSpinner.css'; // Add a CSS file for the spinner

const LoadingSpinner = ({ size = 'medium' }) => {
  return (
    <div data-testid="loading-spinner" className={`spinner-container spinner-${size}`}>
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LoadingSpinner;