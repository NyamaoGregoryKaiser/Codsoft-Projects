import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

function Dashboard({ setGlobalError, setGlobalLoading }) {
  const { authAxios } = useAuth();
  const [tasks, setTasks] = useState([]); // State to hold tasks

  const handleTaskCreated = () => {
    // Re-fetch tasks after a new one is created
    // TaskList component handles its own fetching on mount,
    // but we can trigger it again explicitly if needed.
    // For now, let TaskList manage its own state updates.
    // A simple way is to pass a prop change or use a shared state.
  };

  return (
    <div className="dashboard container">
      {/* TaskForm and TaskList manage their own loading/error state internally 
          but can report up to global error/loading if needed */}
      <TaskForm 
        authAxios={authAxios} 
        onTaskCreated={handleTaskCreated} 
        setError={setGlobalError} 
        setLoading={setGlobalLoading} 
      />
      <TaskList 
        authAxios={authAxios} 
        tasks={tasks} 
        setTasks={setTasks} 
        setError={setGlobalError} 
        setLoading={setGlobalLoading} 
      />
    </div>
  );
}

export default Dashboard;
```