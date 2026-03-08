```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, onDelete, onGenerateApiKey }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{project.description || 'No description provided.'}</p>
        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-bold mb-1">API Key:</label>
          <input
            type="text"
            readOnly
            value={project.api_key}
            className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-sm overflow-hidden text-ellipsis"
            onClick={(e) => e.target.select()}
            title="Click to copy"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Link
          to={`/projects/${project.id}/dashboard`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex-grow text-center"
        >
          View Dashboard
        </Link>
        <Link
          to={`/projects/${project.id}/edit`}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded text-sm flex-grow text-center"
        >
          Edit
        </Link>
        <button
          onClick={() => onGenerateApiKey(project.id)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm flex-grow text-center"
        >
          New API Key
        </button>
        <button
          onClick={() => onDelete(project.id)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm flex-grow text-center"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
```