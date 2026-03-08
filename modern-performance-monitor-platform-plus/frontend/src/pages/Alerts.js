```javascript
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { alertApi, projectApi } from '../api';
import useAuth from '../hooks/useAuth';
import moment from 'moment';

const Alerts = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projectId } = useParams(); // Optional: if we want to show alerts for a specific project
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjectsAndAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsResponse = await projectApi.getProjects();
      setProjects(projectsResponse.data);

      let currentProjectId = selectedProjectId;
      if (!currentProjectId && projectsResponse.data.length > 0) {
        currentProjectId = projectsResponse.data[0].id; // Default to first project
        setSelectedProjectId(currentProjectId);
      }

      if (currentProjectId) {
        const alertsResponse = await alertApi.getAlerts(currentProjectId);
        setAlerts(alertsResponse.data);

        const incidentsResponse = await alertApi.getAlertIncidents(currentProjectId, { status: 'triggered' });
        setIncidents(incidentsResponse.data);
      } else {
        setAlerts([]);
        setIncidents([]);
      }
    } catch (err) {
      console.error('Failed to fetch alerts data:', err);
      setError('Failed to load alerts and incidents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjectsAndAlerts();
      const interval = setInterval(fetchProjectsAndAlerts, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, selectedProjectId]); // Re-fetch if selected project changes

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
  };

  const handleDeleteAlert = async (alertId) => {
    if (!selectedProjectId) return alert('Please select a project first.');
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertApi.deleteAlert(selectedProjectId, alertId);
        fetchProjectsAndAlerts(); // Refresh list
      } catch (err) {
        console.error('Failed to delete alert:', err);
        alert('Failed to delete alert.');
      }
    }
  };

  const handleResolveIncident = async (incidentId) => {
    if (!selectedProjectId) return alert('Please select a project first.');
    if (window.confirm('Mark this incident as resolved?')) {
      try {
        await alertApi.updateAlertIncidentStatus(selectedProjectId, incidentId, 'resolved');
        fetchProjectsAndAlerts(); // Refresh incidents
      } catch (err) {
        console.error('Failed to resolve incident:', err);
        alert('Failed to resolve incident.');
      }
    }
  };

  if (authLoading || loading) {
    return <div className="text-center mt-8">Loading alerts and incidents...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Alerts & Incidents</h1>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <label htmlFor="project-select" className="block text-gray-700 text-sm font-bold mb-2">
            Select Project:
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            {projects.length > 0 ? (
              projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))
            ) : (
              <option value="">No Projects Available</option>
            )}
          </select>
        </div>
        {selectedProjectId && (
          <Link
            to={`/projects/${selectedProjectId}/alerts/new`}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md"
          >
            Create New Alert
          </Link>
        )}
      </div>

      {!selectedProjectId && (
        <p className="text-center text-gray-500 text-lg">Select a project to view its alerts and incidents.</p>
      )}

      {selectedProjectId && (
        <>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Triggered Incidents</h2>
          {incidents.length === 0 ? (
            <p className="text-gray-500">No active incidents for this project.</p>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Alert Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Triggered Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Triggered At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident) => {
                    const alert = alerts.find(a => a.id === incident.alert_id);
                    return (
                      <tr key={incident.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert?.name || 'Unknown Alert'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{JSON.stringify(incident.triggered_value)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(incident.triggered_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleResolveIncident(incident.id)}
                            className="text-green-600 hover:text-green-900 ml-2"
                          >
                            Resolve
                          </button>
                          {/* Add other actions like acknowledge, view details */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-4 text-gray-800">Alert Definitions</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500">No alerts defined for this project.</p>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.metric_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alert.aggregation_type}({alert.field}) {alert.operator} {alert.threshold} (over {alert.time_window_minutes} min)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {alert.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/projects/${selectedProjectId}/alerts/${alert.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Alerts;
```