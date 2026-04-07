import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestionsApi } from '@api/suggestions';
import { databasesApi } from '@api/databases'; // To get database name
import Table from '@components/Table';
import { OptimizationSuggestion, OptimizationSuggestionCreate, OptimizationSuggestionUpdate } from '@types';
import { SuggestionType } from '@types/auth';
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@hooks/useAuth';

const OptimizationSuggestions: React.FC = () => {
  const { dbId } = useParams<{ dbId: string }>();
  const databaseId = dbId ? parseInt(dbId) : null;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [formData, setFormData] = useState<OptimizationSuggestionCreate | OptimizationSuggestionUpdate>({
    databaseId: databaseId!,
    suggestionType: SuggestionType.INDEX,
    description: '',
    sqlCommand: '',
    impactEstimate: 'Medium',
    isApproved: false,
  });

  const { data: database, isLoading: isLoadingDatabase } = useQuery({
    queryKey: ['database', databaseId],
    queryFn: () => databasesApi.getDatabaseById(databaseId!),
    enabled: !!databaseId,
  });

  const { data: suggestions, isLoading: isLoadingSuggestions, error: suggestionsError } = useQuery({
    queryKey: ['suggestions', databaseId],
    queryFn: () => suggestionsApi.getSuggestionsByDatabaseId(databaseId!),
    enabled: !!databaseId,
  });

  const createSuggestionMutation = useMutation({
    mutationFn: suggestionsApi.createSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', databaseId] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => alert(`Error creating suggestion: ${err.message}`),
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: ({ suggestionId, data }: { suggestionId: number; data: OptimizationSuggestionUpdate }) =>
      suggestionsApi.updateSuggestion(suggestionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', databaseId] });
      setIsModalOpen(false);
      setEditingSuggestion(null);
      resetForm();
    },
    onError: (err: Error) => alert(`Error updating suggestion: ${err.message}`),
  });

  const deleteSuggestionMutation = useMutation({
    mutationFn: suggestionsApi.deleteSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', databaseId] });
    },
    onError: (err: Error) => alert(`Error deleting suggestion: ${err.message}`),
  });

  const analyzeSlowQueriesMutation = useMutation({
    mutationFn: suggestionsApi.analyzeSlowQueries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', databaseId] });
      alert('Analysis complete! New suggestions may have been generated.');
    },
    onError: (err: Error) => alert(`Error analyzing slow queries: ${err.message}`),
  });


  const handleCreateNew = () => {
    setEditingSuggestion(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (suggestion: OptimizationSuggestion) => {
    setEditingSuggestion(suggestion);
    setFormData({
      databaseId: suggestion.databaseId,
      suggestionType: suggestion.suggestionType,
      description: suggestion.description,
      sqlCommand: suggestion.sqlCommand,
      impactEstimate: suggestion.impactEstimate,
      isApproved: suggestion.isApproved,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (suggestionId: number) => {
    if (window.confirm('Are you sure you want to delete this optimization suggestion?')) {
      deleteSuggestionMutation.mutate(suggestionId);
    }
  };

  const handleAnalyzeQueries = () => {
    if (databaseId && window.confirm('Run analysis on recent slow queries for this database? This might generate new suggestions.')) {
      analyzeSlowQueriesMutation.mutate(databaseId);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData } as OptimizationSuggestionUpdate;
    if (!isAdmin && editingSuggestion && payload.isApproved !== undefined) {
      delete payload.isApproved; // Prevent non-admins from changing approval status
    }

    if (editingSuggestion) {
      updateSuggestionMutation.mutate({ suggestionId: editingSuggestion.id, data: payload });
    } else {
      createSuggestionMutation.mutate(payload as OptimizationSuggestionCreate);
    }
  };

  const resetForm = () => {
    setFormData({
      databaseId: databaseId!,
      suggestionType: SuggestionType.INDEX,
      description: '',
      sqlCommand: '',
      impactEstimate: 'Medium',
      isApproved: false,
    });
  };

  const columns = [
    { header: 'Type', accessor: 'suggestionType', className: 'w-32' },
    { header: 'Description', accessor: 'description', className: 'w-auto' },
    { header: 'SQL Command', accessor: (row: OptimizationSuggestion) => (
        <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded max-h-24 overflow-y-auto font-mono">
            {row.sqlCommand || 'N/A'}
        </pre>
      ), className: 'w-64'
    },
    { header: 'Impact', accessor: 'impactEstimate', className: 'w-24' },
    {
      header: 'Approved',
      accessor: (row: OptimizationSuggestion) => (
        row.isApproved ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />
      ),
      className: 'w-24 text-center'
    },
    {
      header: 'Actions',
      accessor: (row: OptimizationSuggestion) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="text-indigo-600 hover:text-indigo-900 p-1">
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-900 p-1">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      className: 'w-24'
    },
  ];

  if (isLoadingDatabase || isLoadingSuggestions) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
      Loading suggestions...
    </div>
  );
  if (suggestionsError) return <div className="p-4 text-red-600">Error: {suggestionsError.message}</div>;
  if (!databaseId) return <div className="p-4 text-red-600">Database ID not provided.</div>;
  if (!database) return <div className="p-4 text-red-600">Database not found.</div>;


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Optimization Suggestions for "{database.name}"</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleAnalyzeQueries}
            disabled={analyzeSlowQueriesMutation.isPending}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {analyzeSlowQueriesMutation.isPending ? 'Analyzing...' : 'Analyze Slow Queries'}
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add New Suggestion
          </button>
        </div>
      </div>

      <Table<OptimizationSuggestion>
        data={suggestions || []}
        columns={columns}
        getKey={(sug) => sug.id}
        isLoading={isLoadingSuggestions}
        emptyMessage="No optimization suggestions for this database yet."
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingSuggestion ? 'Edit Suggestion' : 'Create New Suggestion'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="suggestionType" className="block text-sm font-medium text-gray-700">Suggestion Type</label>
                <select
                  id="suggestionType"
                  name="suggestionType"
                  value={formData.suggestionType}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.values(SuggestionType).map((type) => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label htmlFor="sqlCommand" className="block text-sm font-medium text-gray-700">SQL Command (Optional)</label>
                <textarea
                  id="sqlCommand"
                  name="sqlCommand"
                  rows={6}
                  value={formData.sqlCommand || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-xs focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label htmlFor="impactEstimate" className="block text-sm font-medium text-gray-700">Impact Estimate</label>
                <select
                  id="impactEstimate"
                  name="impactEstimate"
                  value={formData.impactEstimate || 'Medium'}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              {isAdmin && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isApproved"
                    name="isApproved"
                    checked={formData.isApproved}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isApproved" className="ml-2 block text-sm font-medium text-gray-700">Is Approved</label>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSuggestionMutation.isPending || updateSuggestionMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSuggestion ? 'Update Suggestion' : 'Create Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizationSuggestions;