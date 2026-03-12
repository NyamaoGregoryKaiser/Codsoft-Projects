```javascript
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { createApplication } from '../api';
import './AddApplicationForm.css';

const AddApplicationForm = ({ onApplicationAdded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name.trim()) {
      toast.error('Application name cannot be empty.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await createApplication({ name, description });
      toast.success(`Application "${response.data.data.name}" added successfully!`);
      setName('');
      setDescription('');
      onApplicationAdded(response.data.data);
    } catch (error) {
      console.error('Error adding application:', error);
      toast.error(`Failed to add application: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-application-form-container">
      <h3>Add New Application</h3>
      <form onSubmit={handleSubmit} className="add-application-form">
        <div className="form-group">
          <label htmlFor="appName">Application Name:</label>
          <input
            type="text"
            id="appName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            aria-label="Application Name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="appDescription">Description (Optional):</label>
          <textarea
            id="appDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            disabled={isSubmitting}
            aria-label="Application Description"
          ></textarea>
        </div>
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Application'}
        </button>
      </form>
    </div>
  );
};

export default AddApplicationForm;
```