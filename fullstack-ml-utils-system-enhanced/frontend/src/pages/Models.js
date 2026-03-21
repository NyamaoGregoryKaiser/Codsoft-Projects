```javascript
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import ModelCard from '../components/ModelCard';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const modelTypes = [
  { value: 'classification', label: 'Classification' },
  { value: 'regression', label: 'Regression' },
];

const classificationAlgorithms = [
  { value: 'logistic_regression', label: 'Logistic Regression' },
  { value: 'random_forest', label: 'Random Forest Classifier' },
  { value: 'svm_classifier', label: 'Support Vector Machine (SVC)' },
  { value: 'decision_tree_classifier', label: 'Decision Tree Classifier' },
];

const regressionAlgorithms = [
  { value: 'linear_regression', label: 'Linear Regression' },
  { value: 'ridge_regression', label: 'Ridge Regression' },
  { value: 'lasso_regression', label: 'Lasso Regression' },
  { value: 'random_forest_regressor', label: 'Random Forest Regressor' },
  { value: 'decision_tree_regressor', label: 'Decision Tree Regressor' },
];

export default function Models() {
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Form states for training new model
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedModelType, setSelectedModelType] = useState('classification');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [featureColumns, setFeatureColumns] = useState([]);
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [hyperparameters, setHyperparameters] = useState('{}'); // JSON string for hyperparameters

  const [editingModel, setEditingModel] = useState(null); // For edit modal

  const fetchModelsAndDatasets = async () => {
    setLoading(true);
    try {
      const modelsResponse = await api.get('/models');
      setModels(modelsResponse.data);

      const datasetsResponse = await api.get('/datasets');
      setDatasets(datasetsResponse.data);
      if (datasetsResponse.data.length > 0) {
        setSelectedDatasetId(datasetsResponse.data[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch models or datasets:", error);
      toast.error("Failed to load models or datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsAndDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDatasetColumns(selectedDatasetId);
    } else {
      setDatasetColumns([]);
      setTargetColumn('');
      setFeatureColumns([]);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    // Reset algorithm when model type changes
    setSelectedAlgorithm('');
  }, [selectedModelType]);


  const fetchDatasetColumns = async (datasetId) => {
    try {
      const response = await api.get(`/datasets/${datasetId}/stats`);
      setDatasetColumns(response.data.columns.map(col => col.name));
    } catch (error) {
      console.error("Failed to fetch dataset columns:", error);
      toast.error("Failed to load dataset columns for model training.");
    }
  };

  const handleTrainModel = async (e) => {
    e.preventDefault();
    if (!modelName || !selectedDatasetId || !selectedModelType || !selectedAlgorithm || !targetColumn) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsTraining(true);
    try {
      const parsedHyperparameters = JSON.parse(hyperparameters);
      const requestBody = {
        name: modelName,
        description: modelDescription,
        dataset_id: parseInt(selectedDatasetId),
        model_type: selectedModelType,
        algorithm: selectedAlgorithm,
        target_column: targetColumn,
        features: featureColumns.length > 0 ? featureColumns : undefined, // If empty, backend will use all non-target columns
        hyperparameters: parsedHyperparameters,
      };
      
      const response = await api.post('/models', requestBody);
      toast.success(`Model "${response.data.name}" trained successfully!`);
      setShowTrainModal(false);
      resetFormStates();
      fetchModelsAndDatasets();
    } catch (error) {
      console.error("Failed to train model:", error);
      toast.error(error.response?.data?.detail || "Failed to train model.");
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (window.confirm("Are you sure you want to delete this model? This action cannot be undone.")) {
      try {
        await api.delete(`/models/${modelId}`);
        toast.success("Model deleted successfully!");
        fetchModelsAndDatasets();
      } catch (error) {
        console.error("Failed to delete model:", error);
        toast.error(error.response?.data?.detail || "Failed to delete model.");
      }
    }
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setModelName(model.name);
    setModelDescription(model.description || '');
    // Other fields (dataset, algorithm etc.) are not editable post-training for simplicity
    setShowTrainModal(true); // Reusing modal for editing metadata
  };

  const handleUpdateModel = async (e) => {
    e.preventDefault();
    if (!modelName) {
      toast.error("Model name cannot be empty.");
      return;
    }
    setIsTraining(true); // Reusing loading state
    try {
      await api.patch(`/models/${editingModel.id}`, {
        name: modelName,
        description: modelDescription,
      });
      toast.success("Model metadata updated successfully!");
      setShowTrainModal(false);
      resetFormStates();
      setEditingModel(null);
      fetchModelsAndDatasets();
    } catch (error) {
      console.error("Failed to update model metadata:", error);
      toast.error(error.response?.data?.detail || "Failed to update model metadata.");
    } finally {
      setIsTraining(false);
    }
  };

  const resetFormStates = () => {
    setModelName('');
    setModelDescription('');
    setSelectedDatasetId(datasets.length > 0 ? datasets[0].id.toString() : '');
    setSelectedModelType('classification');
    setSelectedAlgorithm('');
    setTargetColumn('');
    setFeatureColumns([]);
    setHyperparameters('{}');
    setEditingModel(null);
  };

  const currentAlgorithms = selectedModelType === 'classification' ? classificationAlgorithms : regressionAlgorithms;

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">ML Models</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your trained machine learning models. Train new models, view their performance, and delete them.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => { resetFormStates(); setShowTrainModal(true); }}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Train New Model
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : models.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No models found. Train one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} onDelete={handleDeleteModel} onEdit={handleEditModel} />
            ))}
          </div>
        )}
      </div>

      {/* Train/Edit Model Modal */}
      <Transition appear show={showTrainModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowTrainModal(false)}>
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {editingModel ? 'Edit Model Metadata' : 'Train New ML Model'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <form onSubmit={editingModel ? handleUpdateModel : handleTrainModel} className="space-y-4">
                      <div>
                        <label htmlFor="model-name" className="block text-sm font-medium text-gray-700">
                          Model Name
                        </label>
                        <input
                          type="text"
                          id="model-name"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={modelName}
                          onChange={(e) => setModelName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="model-description" className="block text-sm font-medium text-gray-700">
                          Description (Optional)
                        </label>
                        <textarea
                          id="model-description"
                          rows="3"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={modelDescription}
                          onChange={(e) => setModelDescription(e.target.value)}
                        ></textarea>
                      </div>

                      {!editingModel && ( // Only show these fields for new model training
                        <>
                          <div>
                            <label htmlFor="select-dataset" className="block text-sm font-medium text-gray-700">
                              Select Dataset
                            </label>
                            <select
                              id="select-dataset"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={selectedDatasetId}
                              onChange={(e) => setSelectedDatasetId(e.target.value)}
                              required
                            >
                              <option value="">-- Select a dataset --</option>
                              {datasets.map((dataset) => (
                                <option key={dataset.id} value={dataset.id}>
                                  {dataset.name} (ID: {dataset.id})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="model-type" className="block text-sm font-medium text-gray-700">
                              Model Type
                            </label>
                            <select
                              id="model-type"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={selectedModelType}
                              onChange={(e) => setSelectedModelType(e.target.value)}
                              required
                            >
                              {modelTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700">
                              Algorithm
                            </label>
                            <select
                              id="algorithm"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={selectedAlgorithm}
                              onChange={(e) => setSelectedAlgorithm(e.target.value)}
                              required
                            >
                              <option value="">-- Select an algorithm --</option>
                              {currentAlgorithms.map((algo) => (
                                <option key={algo.value} value={algo.value}>
                                  {algo.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="target-column" className="block text-sm font-medium text-gray-700">
                              Target Column
                            </label>
                            <select
                              id="target-column"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={targetColumn}
                              onChange={(e) => setTargetColumn(e.target.value)}
                              required
                            >
                              <option value="">-- Select target column --</option>
                              {datasetColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="feature-columns" className="block text-sm font-medium text-gray-700">
                              Feature Columns (Select multiple, leave blank for all others)
                            </label>
                            <select
                              id="feature-columns"
                              multiple
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24"
                              value={featureColumns}
                              onChange={(e) =>
                                setFeatureColumns(Array.from(e.target.selectedOptions, (option) => option.value))
                              }
                            >
                              {datasetColumns
                                .filter((col) => col !== targetColumn)
                                .map((col) => (
                                  <option key={col} value={col}>
                                    {col}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="hyperparameters" className="block text-sm font-medium text-gray-700">
                              Hyperparameters (JSON format)
                            </label>
                            <textarea
                              id="hyperparameters"
                              rows="4"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                              value={hyperparameters}
                              onChange={(e) => setHyperparameters(e.target.value)}
                              placeholder='{"n_estimators": 100, "max_depth": 10}'
                            ></textarea>
                            <p className="mt-1 text-xs text-gray-500">
                              Example: `{"C": 1.0, "solver": "liblinear"}` for Logistic Regression. Refer to scikit-learn docs for algorithms.
                            </p>
                          </div>
                        </>
                      )}

                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setShowTrainModal(false)}
                          disabled={isTraining}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                          disabled={isTraining}
                        >
                          {isTraining ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          {editingModel ? 'Update Model' : 'Train Model'}
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