```javascript
import React from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { TrashIcon, ChartPieIcon, PencilSquareIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const ModelCard = ({ model, onDelete, onEdit }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          <Link to={`/models/${model.id}`} className="hover:text-blue-600">
            {model.name}
          </Link>
        </h3>
        <p className="text-sm text-gray-600 mb-4">{model.description || "No description provided."}</p>

        <div className="mb-4">
          <p className="text-sm text-gray-700">
            <AcademicCapIcon className="inline-block h-4 w-4 mr-1 text-gray-500" />
            <span className="font-medium">Algorithm:</span> {model.algorithm.replace(/_/g, ' ').toUpperCase()}
          </p>
          <p className="text-sm text-gray-700">
            <ChartPieIcon className="inline-block h-4 w-4 mr-1 text-gray-500" />
            <span className="font-medium">Type:</span> {model.model_type.toUpperCase()}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Target:</span> {model.target_column}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Dataset ID:</span> {model.dataset_id}
          </p>
        </div>

        {model.metrics && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">Metrics:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {Object.entries(model.metrics).map(([key, value]) => (
                <li key={key}>
                  {key.replace(/_/g, ' ').toCapitalCase()}: {typeof value === 'number' ? value.toFixed(4) : value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Created: {dayjs(model.created_at).format('YYYY-MM-DD HH:mm')}</span>
        <div className="flex space-x-2">
          <Link to={`/models/${model.id}`} className="text-blue-600 hover:text-blue-900" title="View Details">
            <ChartPieIcon className="h-5 w-5" />
          </Link>
          <button onClick={() => onEdit(model)} className="text-gray-600 hover:text-gray-900" title="Edit Model">
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onDelete(model.id)} className="text-red-600 hover:text-red-900" title="Delete Model">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper to capitalize first letter of each word
if (!String.prototype.toCapitalCase) {
  String.prototype.toCapitalCase = function() {
    return this.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
}

export default ModelCard;
```