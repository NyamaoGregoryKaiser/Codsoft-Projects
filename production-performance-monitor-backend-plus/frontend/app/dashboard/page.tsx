"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, api } from "@/utils/api";
import { Application } from "@/types";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function DashboardPage() {
  const { user } = useAuth();
  const { data: applications, error, isLoading, mutate } = useSWR<Application[]>(user ? "/api/v1/applications/" : null, api.get);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [createAppError, setCreateAppError] = useState<string | null>(null);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAppError(null);
    setIsCreatingApp(true);
    try {
      await api.post("/api/v1/applications/", {
        name: newAppName,
        description: newAppDescription,
      });
      setNewAppName("");
      setNewAppDescription("");
      mutate(); // Re-fetch applications
    } catch (err: any) {
      setCreateAppError(err.response?.data?.detail || "Failed to create application.");
    } finally {
      setIsCreatingApp(false);
    }
  };

  if (isLoading) return <p>Loading applications...</p>;
  if (error) return <p className="text-danger">Failed to load applications: {error.message}</p>;

  return (
    <ProtectedRoute>
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create New Application Card */}
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Create New Application</h2>
            <form onSubmit={handleCreateApplication}>
              <div className="mb-4">
                <label htmlFor="appName" className="block text-sm font-medium text-textdark dark:text-textlight">
                  Application Name
                </label>
                <input
                  type="text"
                  id="appName"
                  className="input"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="appDescription" className="block text-sm font-medium text-textdark dark:text-textlight">
                  Description (Optional)
                </label>
                <textarea
                  id="appDescription"
                  className="input"
                  rows={3}
                  value={newAppDescription}
                  onChange={(e) => setNewAppDescription(e.target.value)}
                ></textarea>
              </div>
              {createAppError && <p className="text-danger text-sm mb-4">{createAppError}</p>}
              <button type="submit" className="btn-primary w-full" disabled={isCreatingApp}>
                {isCreatingApp ? "Creating..." : "Create Application"}
              </button>
            </form>
          </div>

          {/* Existing Applications */}
          {applications?.length === 0 && (
            <p className="md:col-span-2 lg:col-span-2 text-center text-lg text-gray-600 dark:text-gray-400">
              You haven&apos;t created any applications yet. Start by creating one!
            </p>
          )}
          {applications?.map((app) => (
            <div key={app.id} className="card p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{app.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{app.description || "No description provided."}</p>
              </div>
              <Link href={`/application/${app.id}`} className="btn-secondary text-center w-full mt-4">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default DashboardPage;