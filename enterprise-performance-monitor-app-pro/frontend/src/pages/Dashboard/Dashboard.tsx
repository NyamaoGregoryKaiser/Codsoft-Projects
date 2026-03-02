import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createApplication,
  deleteApplication,
  getApplications,
} from '../../api/applications';
import { Application } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'; // For icons

const Dashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDescription, setNewAppDescription] = useState('');
  const [addAppLoading, setAddAppLoading] = useState(false);
  const [addAppError, setAddAppError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
      console.error('Fetch applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAppError(null);
    setAddAppLoading(true);
    try {
      const newApp = await createApplication({
        name: newAppName,
        description: newAppDescription,
      });
      setApplications([...applications, newApp]);
      setShowAddModal(false);
      setNewAppName('');
      setNewAppDescription('');
      alert(`Application "${newApp.name}" created! API Key: ${newApp.apiKey}. Please save this key, it will not be shown again.`);
    } catch (err: any) {
      setAddAppError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create application');
      console.error('Create application error:', err);
    } finally {
      setAddAppLoading(false);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (window.confirm('Are you sure you want to delete this application and all its data?')) {
      try {
        await deleteApplication(appId);
        setApplications(applications.filter((app) => app.id !== appId));
        alert('Application deleted successfully!');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete application');
        console.error('Delete application error:', err);
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading applications...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Applications</h1>
        <Button onClick={() => setShowAddModal(true)} variant="primary">
          <PlusIcon className="h-5 w-5 mr-2 inline-block" /> Add New Application
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center p-8 border rounded-lg shadow-sm bg-white">
          <p className="text-lg text-gray-600 mb-4">You haven't added any applications yet.</p>
          <Button onClick={() => setShowAddModal(true)} variant="primary">
            <PlusIcon className="h-5 w-5 mr-2 inline-block" /> Add Your First Application
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{app.name}</h2>
              <p className="text-gray-600 mb-4 text-sm">{app.description || 'No description provided.'}</p>
              <div className="flex justify-between items-center mt-4">
                <Link to={`/applications/${app.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                  View Dashboard
                </Link>
                <Button variant="danger" size="sm" onClick={() => handleDeleteApplication(app.id)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Application">
        <form onSubmit={handleCreateApplication}>
          {addAppError && <p className="text-red-500 text-sm mb-4">{addAppError}</p>}
          <Input
            id="appName"
            label="Application Name"
            value={newAppName}
            onChange={(e) => setNewAppName(e.target.value)}
            required
            placeholder="My E-commerce Site"
          />
          <Input
            id="appDescription"
            label="Description (Optional)"
            value={newAppDescription}
            onChange={(e) => setNewAppDescription(e.target.value)}
            placeholder="Brief description of the application"
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={addAppLoading}>
              {addAppLoading ? 'Creating...' : 'Create Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;