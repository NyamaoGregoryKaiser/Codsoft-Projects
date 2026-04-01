```javascript
import React, { useEffect, useState } from 'react';
import { getModels, trainModel, deleteModel, getDatasets } from '../api/api';
import Card from '../components/Card';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/outline';

const Models = () => {
  const [searchParams] = useSearchParams();
  const preselectedDatasetId = searchParams.get('datasetId');

  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(preselectedDatasetId || '');
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('classification'); // default
  const [targetColumn, setTargetColumn] = useState('');
  const [featureColumns, setFeatureColumns] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState('');
  const [trainError, setTrainError] = useState('');

  const fetchModelsAndDatasets = async () => {
    setLoading(true);
    setError('');
    try {
      const modelsRes = await getModels();
      setModels(modelsRes.data);
      const datasetsRes = await getDatasets();
      setDatasets(datasetsRes.data);
    } catch (err) {
      console.error('Failed to fetch models or datasets:', err);
      setError(err.response?.data?.detail || 'Failed to load models or datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsAndDatasets();
  }, []);

  useEffect(() => {
    const loadDatasetColumns = async () => {
      if (selectedDataset) {
        try {
          const dataset = datasets.find(d => String(d.id) === selectedDataset);
          if (dataset && dataset.column_info) {
            setAvailableColumns(Object.keys(dataset.column_info));
            setTargetColumn('');
            setFeatureColumns([]);
          } else {
            setAvailableColumns([]);
          }
        } catch (err) {
          console.error('Failed to load dataset columns:', err);
        }
      } else {
        setAvailableColumns([]);
      }
    };
    loadDatasetColumns();
  }, [selectedDataset, datasets]);

  const handleDatasetChange = (e) => {
    setSelectedDataset(e.target.value);
  };

  const handleFeatureChange = (e) => {
    const { value, checked } = e.target;
    setFeatureColumns((prev) =>
      checked ? [...prev, value] : prev.filter((col) => col !== value)
    );
  };

  const handleTrainModel = async (e) => {
    e.preventDefault();
    setTraining(true);
    setTrainError('');

    if (!selectedDataset || !modelName || !modelType || !targetColumn || featureColumns.length === 0) {
      setTrainError('Please fill all required fields: Dataset, Name, Type, Target Column, and at least one Feature Column.');
      setTraining(false);
      return;
    }

    const modelData = {
      name: modelName,
      model_type: modelType,
      dataset_id: parseInt(selectedDataset),
      target_column: targetColumn,
      features: featureColumns,
      description: `Trained on ${new Date().toLocaleDateString()}`
    };

    try {
      await trainModel(modelData);
      // Clear form
      setModelName('');
      setSelectedDataset('');
      setTargetColumn('');
      setFeatureColumns([]);
      setAvailableColumns([]);
      await fetchModelsAndDatasets(); // Refresh list
    } catch (err) {
      console.error('Failed to train model:', err);
      setTrainError(err.response?.data?.detail || 'Failed to train model.');
    } finally {
      setTraining(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this model and all its associated experiments? This action cannot be undone.')) {
      try {
        await deleteModel(id);
        await fetchModelsAndDatasets(); // Refresh list
      } catch (err) {
        console.error('Failed to delete model:', err);
        setError(err.response?.data?.detail || 'Failed to delete model.');
      }
    }
  };

  if (loading) return <div>Loading models...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Your Models</h1>

      <Card title="Train New Model">
        <form onSubmit={handleTrainModel} className="space-y-4">
          <div>
            <label htmlFor="dataset-select" className="block text-sm font-medium text-gray-700">Dataset</label>
            <select
              id="dataset-select"
              className="input-field"
              value={selectedDataset}
              onChange={handleDatasetChange}
              required
            >
              <option value="">Select a Dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.row_count} rows)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="model-name" className="block text-sm font-medium text-gray-700">Model Name</label>
            <input
              type="text"
              id="model-name"
              className="input-field"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="model-type" className="block text-sm font-medium text-gray-700">Model Type</label>
            <select
              id="model-type"
              className="input-field"
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              required
            >
              <option value="classification">Classification</option>
              <option value="regression">Regression</option>
            </select>
          </div>
          <div>
            <label htmlFor="target-column" className="block text-sm font-medium text-gray-700">Target Column</label>
            <select
              id="target-column"
              className="input-field"
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              required
              disabled={!selectedDataset}
            >
              <option value="">Select Target Column</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Feature Columns</label>
            <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-md">
              {availableColumns
                .filter(col => col !== targetColumn)
                .map((col) => (
                <div key={col} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`feature-${col}`}
                    value={col}
                    checked={featureColumns.includes(col)}
                    onChange={handleFeatureChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={!selectedDataset}
                  />
                  <label htmlFor={`feature-${col}`} className="ml-2 text-sm text-gray-900">{col}</label>
                </div>
              ))}
            </div>
            {featureColumns.length === 0 && selectedDataset && (
              <p className="text-red-500 text-sm mt-1">Please select at least one feature column.</p>
            )}
          </div>
          {trainError && <p className="text-red-500 text-sm">{trainError}</p>}
          <div>
            <button type="submit" className="btn-primary" disabled={training}>
              {training ? 'Training...' : 'Train Model'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Existing Models">
        {models.length === 0 ? (
          <p className="text-gray-600">You haven't trained any models yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {models.map((model) => (
              <li key={model.id} className="py-4 flex justify-between items-center">
                <div>
                  <Link to={`/models/${model.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                    {model.name}
                  </Link>
                  <p className="text-sm text-gray-500">{model.model_type} | Target: {model.target_column}</p>
                  <p className="text-xs text-gray-400">Trained on: {new Date(model.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Link to={`/experiments?modelId=${model.id}`} className="btn-secondary text-sm">View Experiments</Link>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="btn-danger text-sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Models;
```