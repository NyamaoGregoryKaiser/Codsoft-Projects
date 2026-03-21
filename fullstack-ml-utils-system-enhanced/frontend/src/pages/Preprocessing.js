```javascript
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { InformationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const preprocessingOptions = {
  imputation: [
    { value: 'mean', label: 'Mean Imputation (Numerical)' },
    { value: 'median', label: 'Median Imputation (Numerical)' },
    { value: 'mode', label: 'Mode Imputation (Numerical & Categorical)' },
    { value: 'constant', label: 'Constant Value Imputation (Numerical & Categorical)' },
  ],
  scaling: [
    { value: 'standard', label: 'Standard Scaling (StandardScaler)' },
    { value: 'minmax', label: 'Min-Max Scaling (MinMaxScaler)' },
  ],
  encoding: [
    { value: 'onehot', label: 'One-Hot Encoding (Categorical)' },
    // { value: 'label', label: 'Label Encoding (Categorical - use with care)' },
  ],
  drop_columns: [], // Dynamically populated
};

export default function Preprocessing() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // State for preprocessing steps configuration
  const [imputationConfig, setImputationConfig] = useState({});
  const [scalingConfig, setScalingConfig] = useState({});
  const [encodingConfig, setEncodingConfig] = useState({});
  const [dropColumnConfig, setDropColumnConfig] = useState({ columns: [] });

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDatasetColumns(selectedDatasetId);
    } else {
      setDatasetColumns([]);
    }
  }, [selectedDatasetId]);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/datasets');
      setDatasets(response.data);
      if (response.data.length > 0) {
        setSelectedDatasetId(response.data[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
      toast.error("Failed to load datasets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasetColumns = async (datasetId) => {
    try {
      const response = await api.get(`/datasets/${datasetId}/stats`);
      const columns = response.data.columns.map(col => col.name);
      setDatasetColumns(columns);
    } catch (error) {
      console.error("Failed to fetch dataset columns:", error);
      toast.error("Failed to load dataset columns for preprocessing.");
    }
  };

  const handleApplyPreprocessing = async (e) => {
    e.preventDefault();
    if (!selectedDatasetId || !newDatasetName) {
      toast.error("Please select an original dataset and provide a name for the new dataset.");
      return;
    }

    const config = {
      imputation: Object.keys(imputationConfig).length > 0 && imputationConfig.strategy ? imputationConfig : undefined,
      scaling: Object.keys(scalingConfig).length > 0 && scalingConfig.strategy ? scalingConfig : undefined,
      encoding: Object.keys(encodingConfig).length > 0 && encodingConfig.strategy ? encodingConfig : undefined,
      drop_columns: dropColumnConfig.columns.length > 0 ? dropColumnConfig : undefined,
    };

    // Ensure at least one actual preprocessing step is defined
    if (!config.imputation && !config.scaling && !config.encoding && !config.drop_columns) {
      toast.error("Please configure at least one preprocessing step.");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestBody = {
        dataset_id: parseInt(selectedDatasetId),
        new_dataset_name: newDatasetName,
        description: newDatasetDescription,
        config: config,
      };
      const response = await api.post('/preprocessing/apply', requestBody);
      toast.success(response.data.message);
      navigate(`/datasets/${response.data.new_dataset_id}`);
    } catch (error) {
      console.error("Failed to apply preprocessing:", error);
      toast.error(error.response?.data?.detail || "Failed to apply preprocessing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderColumnSelector = (configKey, currentConfig, setConfig) => (
    <div className="mt-2 p-2 border rounded-md bg-gray-50">
      <label htmlFor={`${configKey}-cols`} className="block text-sm font-medium text-gray-700">
        Columns to apply to (leave blank for all applicable)
      </label>
      <select
        id={`${configKey}-cols`}
        multiple
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24"
        value={currentConfig.target_columns || []}
        onChange={(e) =>
          setConfig({
            ...currentConfig,
            target_columns: Array.from(e.target.selectedOptions, (option) => option.value),
          })
        }
      >
        {datasetColumns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight text-gray-900">Apply Preprocessing</h1>
        <p className="mt-2 text-sm text-gray-700">
          Select a dataset and apply various preprocessing steps to create a new, transformed dataset.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 bg-white shadow rounded-lg p-6">
        <form onSubmit={handleApplyPreprocessing} className="space-y-6">
          <div>
            <label htmlFor="original-dataset" className="block text-sm font-medium text-gray-700">
              Select Original Dataset
            </label>
            <select
              id="original-dataset"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              required
              disabled={loading}
            >
              {loading ? (
                <option value="">Loading datasets...</option>
              ) : datasets.length === 0 ? (
                <option value="">No datasets available. Upload one first.</option>
              ) : (
                <>
                  <option value="">-- Select a dataset --</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name} (ID: {dataset.id})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="new-dataset-name" className="block text-sm font-medium text-gray-700">
              New Preprocessed Dataset Name
            </label>
            <input
              type="text"
              id="new-dataset-name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              placeholder="e.g., MyDataset_Preprocessed_Scaled"
              required
            />
          </div>

          <div>
            <label htmlFor="new-dataset-description" className="block text-sm font-medium text-gray-700">
              Description for New Dataset (Optional)
            </label>
            <textarea
              id="new-dataset-description"
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newDatasetDescription}
              onChange={(e) => setNewDatasetDescription(e.target.value)}
              placeholder="Describe the transformations applied, e.g., 'Mean imputation, Standard Scaling, One-Hot Encoding'."
            ></textarea>
          </div>

          <hr className="my-8" />

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preprocessing Steps</h2>

          {/* Imputation */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Imputation <InformationCircleIcon className="h-5 w-5 ml-2 text-gray-400" title="Handle missing values" />
            </h3>
            <div className="mt-2">
              <label htmlFor="imputation-strategy" className="block text-sm font-medium text-gray-700">
                Strategy
              </label>
              <select
                id="imputation-strategy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={imputationConfig.strategy || ''}
                onChange={(e) => setImputationConfig({ ...imputationConfig, strategy: e.target.value })}
              >
                <option value="">-- Select Imputation Strategy --</option>
                {preprocessingOptions.imputation.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {imputationConfig.strategy === 'constant' && (
                <input
                  type="text"
                  placeholder="Fill value (e.g., 0 or 'unknown')"
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={imputationConfig.fill_value || ''}
                  onChange={(e) => setImputationConfig({ ...imputationConfig, fill_value: e.target.value })}
                />
              )}
              {imputationConfig.strategy && renderColumnSelector('imputation', imputationConfig, setImputationConfig)}
            </div>
          </div>

          {/* Scaling */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Scaling <InformationCircleIcon className="h-5 w-5 ml-2 text-gray-400" title="Normalize numerical features" />
            </h3>
            <div className="mt-2">
              <label htmlFor="scaling-strategy" className="block text-sm font-medium text-gray-700">
                Strategy
              </label>
              <select
                id="scaling-strategy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={scalingConfig.strategy || ''}
                onChange={(e) => setScalingConfig({ ...scalingConfig, strategy: e.target.value })}
              >
                <option value="">-- Select Scaling Strategy --</option>
                {preprocessingOptions.scaling.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {scalingConfig.strategy && renderColumnSelector('scaling', scalingConfig, setScalingConfig)}
            </div>
          </div>

          {/* Encoding */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Encoding <InformationCircleIcon className="h-5 w-5 ml-2 text-gray-400" title="Convert categorical features to numerical" />
            </h3>
            <div className="mt-2">
              <label htmlFor="encoding-strategy" className="block text-sm font-medium text-gray-700">
                Strategy
              </label>
              <select
                id="encoding-strategy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={encodingConfig.strategy || ''}
                onChange={(e) => setEncodingConfig({ ...encodingConfig, strategy: e.target.value })}
              >
                <option value="">-- Select Encoding Strategy --</option>
                {preprocessingOptions.encoding.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {encodingConfig.strategy && renderColumnSelector('encoding', encodingConfig, setEncodingConfig)}
            </div>
          </div>

          {/* Drop Columns */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Drop Columns <InformationCircleIcon className="h-5 w-5 ml-2 text-gray-400" title="Remove unnecessary columns" />
            </h3>
            <div className="mt-2">
              <label htmlFor="drop-columns-select" className="block text-sm font-medium text-gray-700">
                Columns to Drop
              </label>
              <select
                id="drop-columns-select"
                multiple
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24"
                value={dropColumnConfig.columns}
                onChange={(e) =>
                  setDropColumnConfig({
                    columns: Array.from(e.target.selectedOptions, (option) => option.value),
                  })
                }
              >
                {datasetColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isSubmitting || !selectedDatasetId || !newDatasetName}
            >
              {isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Apply Preprocessing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```