```typescript jsx
import React, { useState, useEffect } from 'react';
import { createService, getAllServices, Service, CreateServiceRequest } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Services: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDescription, setNewServiceDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNewServiceApiKey, setShowNewServiceApiKey] = useState<string | null>(null);


  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedServices = await getAllServices();
      setServices(fetchedServices);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch services.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setShowNewServiceApiKey(null);

    if (!newServiceName || !newServiceDescription) {
        setError("Service name and description are required.");
        return;
    }

    const serviceData: CreateServiceRequest = {
      name: newServiceName,
      description: newServiceDescription,
    };

    try {
      const createdService = await createService(serviceData);
      setServices([...services, createdService]);
      setNewServiceName('');
      setNewServiceDescription('');
      setSuccessMessage(`Service "${createdService.name}" created successfully!`);
      if (createdService.api_key) {
        setShowNewServiceApiKey(createdService.api_key);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create service.');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <main>
      <h2>Services Management</h2>

      {user?.role === 'admin' && (
        <div className="card mb-20">
          <h3>Create New Service</h3>
          <form onSubmit={handleCreateService}>
            <div className="form-group">
              <label htmlFor="service-name">Service Name:</label>
              <input
                type="text"
                id="service-name"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="service-description">Description:</label>
              <textarea
                id="service-description"
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                rows={3}
                required
              ></textarea>
            </div>
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            {showNewServiceApiKey && (
                <div className="app-alert app-alert-info mt-10">
                    <p><strong>New Service API Key (Copy Now!):</strong></p>
                    <code style={{ wordBreak: 'break-all' }}>{showNewServiceApiKey}</code>
                    <p>This key is shown only once for security reasons. Store it securely!</p>
                </div>
            )}
            <button type="submit" className="form-button">Create Service</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>All Services</h3>
        {services.length === 0 ? (
          <p className="app-alert app-alert-info">No services registered yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                {user?.role === 'admin' && <th>API Key</th>} {/* Only show API key to admin */}
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.id}</td>
                  <td>{service.name}</td>
                  <td>{service.description}</td>
                  {user?.role === 'admin' && (
                    <td>
                      <code style={{ wordBreak: 'break-all' }}>
                        {service.api_key || 'N/A'}
                      </code>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};

export default Services;
```