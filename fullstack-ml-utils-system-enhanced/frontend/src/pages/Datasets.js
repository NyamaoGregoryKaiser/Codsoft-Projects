```javascript
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import DatasetTable from '../components/DatasetTable';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null); // For edit modal

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/datasets');
      setDatasets(response.data);
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
      toast.error("Failed to load datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !newDatasetName) {
      toast.error("Please provide a file and a name for the dataset.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', newDatasetName);
    if (newDatasetDescription) {
      formData.append('description', newDatasetDescription);
    }

    try {
      await api.post('/datasets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Dataset uploaded successfully!");
      setShowUploadModal(false);
      setUploadFile(null);
      setNewDatasetName('');
      setNewDatasetDescription('');
      fetchDatasets(); // Refresh list
    } catch (error) {
      console.error("Failed to upload dataset:", error);
      toast.error(error.response?.data?.detail || "Failed to upload dataset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDataset = async (datasetId) => {
    if (window.confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      try {
        await api.delete(`/datasets/${datasetId}`);
        toast.success("Dataset deleted successfully!");
        fetchDatasets(); // Refresh list
      } catch (error) {
        console.error("Failed to delete dataset:", error);
        toast.error(error.response?.data?.detail || "Failed to delete dataset.");
      }
    }
  };

  const handleEditDataset = (dataset) => {
    setEditingDataset(dataset);
    setNewDatasetName(dataset.name);
    setNewDatasetDescription(dataset.description || '');
    setShowUploadModal(true); // Reusing the modal for editing
  };

  const handleUpdateDataset = async (e) => {
    e.preventDefault();
    if (!newDatasetName) {
      toast.error("Dataset name cannot be empty.");
      return;
    }

    setIsUploading(true); // Using same loading state
    try {
      await api.patch(`/datasets/${editingDataset.id}`, {
        name: newDatasetName,
        description: newDatasetDescription,
      });
      toast.success("Dataset updated successfully!");
      setShowUploadModal(false);
      setEditingDataset(null);
      setNewDatasetName('');
      setNewDatasetDescription('');
      fetchDatasets();
    } catch (error) {
      console.error("Failed to update dataset:", error);
      toast.error(error.response?.data?.detail || "Failed to update dataset.");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Datasets</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all the datasets you have uploaded, including their name, description, and metadata.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => { setEditingDataset(null); setShowUploadModal(true); }}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Upload Dataset
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <DatasetTable datasets={datasets} onDelete={handleDeleteDataset} onEdit={handleEditDataset} />
        )}
      </div>

      {/* Upload/Edit Dataset Modal */}
      <Transition appear show={showUploadModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowUploadModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {editingDataset ? 'Edit Dataset' : 'Upload New Dataset'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <form onSubmit={editingDataset ? handleUpdateDataset : handleUploadSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Dataset Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={newDatasetName}
                          onChange={(e) => setNewDatasetName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description (Optional)
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows="3"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={newDatasetDescription}
                          onChange={(e) => setNewDatasetDescription(e.target.value)}
                        ></textarea>
                      </div>
                      {!editingDataset && (
                        <div>
                          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                            Select File (CSV or Parquet)
                          </label>
                          <input
                            type="file"
                            name="file"
                            id="file"
                            accept=".csv,.parquet"
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            required={!editingDataset}
                          />
                        </div>
                      )}

                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setShowUploadModal(false)}
                          disabled={isUploading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          {editingDataset ? 'Update Dataset' : 'Upload Dataset'}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
```