"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/utils/api";
import { Application, Metric, MetricType } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import MetricChart from "@/components/MetricChart";

function ApplicationDetailPage() {
  const { id } = useParams();
  const appId = Array.isArray(id) ? id[0] : id;

  const { data: application, error: appError, isLoading: appLoading, mutate: mutateApp } = useSWR<Application>(
    appId ? `/api/v1/applications/${appId}` : null,
    api.get
  );
  const { data: metrics, error: metricsError, isLoading: metricsLoading, mutate: mutateMetrics } = useSWR<Metric[]>(
    appId ? `/api/v1/metrics/app/${appId}` : null,
    api.get
  );

  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricUnit, setNewMetricUnit] = useState("");
  const [newMetricType, setNewMetricType] = useState<MetricType>(MetricType.GAUGE);
  const [newMetricWarning, setNewMetricWarning] = useState<number | undefined>(undefined);
  const [newMetricCritical, setNewMetricCritical] = useState<number | undefined>(undefined);
  const [createMetricError, setCreateMetricError] = useState<string | null>(null);
  const [isCreatingMetric, setIsCreatingMetric] = useState(false);

  const [editAppMode, setEditAppMode] = useState(false);
  const [editedAppName, setEditedAppName] = useState("");
  const [editedAppDescription, setEditedAppDescription] = useState("");
  const [editAppError, setEditAppError] = useState<string | null>(null);
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);

  const [isDeletingApp, setIsDeletingApp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditApp = () => {
    if (application) {
      setEditedAppName(application.name);
      setEditedAppDescription(application.description || "");
      setEditAppMode(true);
    }
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditAppError(null);
    setIsUpdatingApp(true);
    try {
      await api.put(`/api/v1/applications/${appId}`, {
        name: editedAppName,
        description: editedAppDescription,
      });
      mutateApp();
      setEditAppMode(false);
    } catch (err: any) {
      setEditAppError(err.response?.data?.detail || "Failed to update application.");
    } finally {
      setIsUpdatingApp(false);
    }
  };

  const handleDeleteApplication = async () => {
    setIsDeletingApp(true);
    try {
      await api.delete(`/api/v1/applications/${appId}`);
      // Redirect to dashboard after successful deletion
      window.location.href = "/dashboard"; // Using window.location to force full refresh due to SWR cache issues with redirects
    } catch (err: any) {
      setEditAppError(err.response?.data?.detail || "Failed to delete application.");
    } finally {
      setIsDeletingApp(false);
    }
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMetricError(null);
    setIsCreatingMetric(true);
    try {
      await api.post(`/api/v1/metrics/app/${appId}`, {
        name: newMetricName,
        unit: newMetricUnit || null,
        metric_type: newMetricType,
        threshold_warning: newMetricWarning || null,
        threshold_critical: newMetricCritical || null,
      });
      setNewMetricName("");
      setNewMetricUnit("");
      setNewMetricType(MetricType.GAUGE);
      setNewMetricWarning(undefined);
      setNewMetricCritical(undefined);
      mutateMetrics();
    } catch (err: any) {
      setCreateMetricError(err.response?.data?.detail || "Failed to create metric.");
    } finally {
      setIsCreatingMetric(false);
    }
  };

  if (appLoading || metricsLoading) return <p>Loading application details...</p>;
  if (appError) return <p className="text-danger">Failed to load application: {appError.message}</p>;
  if (metricsError) return <p className="text-danger">Failed to load metrics: {metricsError.message}</p>;
  if (!application) return <p>Application not found.</p>;

  return (
    <ProtectedRoute>
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-4">{application.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{application.description}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Application Details & Actions */}
          <div className="lg:col-span-1 card p-6">
            <h2 className="text-2xl font-semibold mb-4">Application Settings</h2>
            {!editAppMode ? (
              <>
                <div className="mb-4">
                  <p className="font-medium">API Key:</p>
                  <code className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm block overflow-x-auto">
                    {application.api_key}
                  </code>
                  <p className="text-sm text-gray-500 mt-1">Use this key to send metric data from your application.</p>
                </div>
                <div className="flex space-x-4">
                  <button onClick={handleEditApp} className="btn-secondary">
                    Edit Application
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
                    Delete Application
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdateApplication}>
                <div className="mb-4">
                  <label htmlFor="editAppName" className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    id="editAppName"
                    className="input"
                    value={editedAppName}
                    onChange={(e) => setEditedAppName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="editAppDescription" className="block text-sm font-medium">Description</label>
                  <textarea
                    id="editAppDescription"
                    className="input"
                    rows={3}
                    value={editedAppDescription}
                    onChange={(e) => setEditedAppDescription(e.target.value)}
                  ></textarea>
                </div>
                {editAppError && <p className="text-danger text-sm mb-4">{editAppError}</p>}
                <div className="flex space-x-4">
                  <button type="submit" className="btn-primary" disabled={isUpdatingApp}>
                    {isUpdatingApp ? "Updating..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setEditAppMode(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showDeleteConfirm && (
              <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded-md">
                <p className="text-red-700 dark:text-red-300 mb-3">
                  Are you sure you want to delete this application and all its metrics and data? This action is irreversible.
                </p>
                <div className="flex space-x-4">
                  <button onClick={handleDeleteApplication} className="btn-danger" disabled={isDeletingApp}>
                    {isDeletingApp ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add New Metric */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-2xl font-semibold mb-4">Add New Metric</h2>
            <form onSubmit={handleCreateMetric} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="metricName" className="block text-sm font-medium">Metric Name</label>
                <input
                  type="text"
                  id="metricName"
                  className="input"
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="metricUnit" className="block text-sm font-medium">Unit (e.g., %, ms)</label>
                <input
                  type="text"
                  id="metricUnit"
                  className="input"
                  value={newMetricUnit}
                  onChange={(e) => setNewMetricUnit(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="metricType" className="block text-sm font-medium">Metric Type</label>
                <select
                  id="metricType"
                  className="input"
                  value={newMetricType}
                  onChange={(e) => setNewMetricType(e.target.value as MetricType)}
                >
                  {Object.values(MetricType).map((type) => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="warningThreshold" className="block text-sm font-medium">Warning Threshold</label>
                <input
                  type="number"
                  step="any"
                  id="warningThreshold"
                  className="input"
                  value={newMetricWarning ?? ""}
                  onChange={(e) => setNewMetricWarning(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label htmlFor="criticalThreshold" className="block text-sm font-medium">Critical Threshold</label>
                <input
                  type="number"
                  step="any"
                  id="criticalThreshold"
                  className="input"
                  value={newMetricCritical ?? ""}
                  onChange={(e) => setNewMetricCritical(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div className="md:col-span-2">
                {createMetricError && <p className="text-danger text-sm mb-4">{createMetricError}</p>}
                <button type="submit" className="btn-primary w-full" disabled={isCreatingMetric}>
                  {isCreatingMetric ? "Creating..." : "Add Metric"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Metrics Overview */}
        <h2 className="text-3xl font-bold mb-6">Metrics</h2>
        {metrics && metrics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {metrics.map((metric) => (
              <MetricChart key={metric.id} metric={metric} />
            ))}
          </div>
        ) : (
          <p className="text-center text-lg text-gray-600 dark:text-gray-400">
            No metrics defined for this application yet.
          </p>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default ApplicationDetailPage;