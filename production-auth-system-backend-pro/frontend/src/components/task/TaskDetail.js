```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import taskService from '../../services/task.service';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await taskService.getTaskById(id);
        setTask(data);
      } catch (err) {
        setError('Failed to fetch task: ' + (err || 'Unknown error'));
        console.error('Failed to fetch task:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading task details...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!task) {
    return <div className="text-center py-8 text-gray-600">Task not found.</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Dashboard
        </button>
      </div>

      <div className="mb-6">
        <p className="text-lg text-gray-700 mb-2">
          <strong>Description:</strong> {task.description || 'No description provided.'}
        </p>
        <p className={`text-lg font-semibold ${task.completed ? 'text-green-600' : 'text-yellow-600'}`}>
          Status: {task.completed ? 'Completed' : 'Pending'}
        </p>
      </div>

      <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
        <p>Created At: {new Date(task.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(task.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TaskDetail;
```