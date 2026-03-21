```javascript
import React from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const DatasetTable = ({ datasets, onDelete, onEdit }) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Rows
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Columns
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {datasets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">No datasets found. Upload one to get started!</td>
                    </tr>
                  ) : (
                    datasets.map((dataset) => (
                      <tr key={dataset.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link to={`/datasets/${dataset.id}`} className="text-blue-600 hover:text-blue-900">
                            {dataset.name}
                          </Link>
                          {dataset.is_preprocessed && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Preprocessed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {dataset.description || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {dataset.row_count || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {dataset.column_count || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {dayjs(dataset.created_at).format('YYYY-MM-DD HH:mm')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center space-x-2 justify-end">
                            <Link to={`/datasets/${dataset.id}`} className="text-indigo-600 hover:text-indigo-900" title="View Details & Statistics">
                              <ChartBarIcon className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => onEdit(dataset)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Dataset"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onDelete(dataset.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Dataset"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetTable;
```