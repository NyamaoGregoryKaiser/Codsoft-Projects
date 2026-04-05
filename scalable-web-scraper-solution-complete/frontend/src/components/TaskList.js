import React, { useState, useEffect } from 'react';
import ResultList from './ResultList';

function TaskList({ authAxios, setError, setLoading, tasks, setTasks }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.get('/tasks/');
      setTasks(response.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      await authAxios.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
      setSuccessMessage('Task deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete task:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to delete task.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRun = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      await authAxios.post(`/tasks/${taskId}/run`);
      setSuccessMessage('Task run triggered successfully!');
      fetchTasks(); // Refresh tasks to show updated status/next_run_at
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to trigger task run:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to trigger task run.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (task) => {
    setSelectedTask(task);
    setShowResultsModal(true);
  };

  const handleCloseResultsModal = () => {
    setShowResultsModal(false);
    setSelectedTask(null);
  };

  return (
    <div className="task-list">
      <h2>Your Scraping Tasks</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <div className="task-details">
              <h3>{task.name}</h3>
              <p>URL: {task.target_url}</p>
              <p>Status: <strong>{task.status}</strong></p>
              <p>Frequency: {task.frequency_seconds / 60} mins</p>
              <p>Last Run: {task.last_run_at ? new Date(task.last_run_at).toLocaleString() : 'N/A'}</p>
              <p>Next Run: {task.next_run_at ? new Date(task.next_run_at).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="task-actions">
              <button className="btn" onClick={() => handleTriggerRun(task.id)}>Run Now</button>
              <button className="btn" onClick={() => handleViewResults(task)}>View Results</button>
              <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {showResultsModal && selectedTask && (
        <ResultList
          task={selectedTask}
          authAxios={authAxios}
          onClose={handleCloseResultsModal}
          setError={setError}
          setLoading={setLoading}
        />
      )}
    </div>
  );
}

export default TaskList;
```