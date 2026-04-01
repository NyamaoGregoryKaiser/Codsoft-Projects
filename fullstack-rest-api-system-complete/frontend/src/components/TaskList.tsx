import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus, User } from '../types';
import { taskApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TaskListProps {
  tasks: Task[];
  projectId: string;
  onTaskUpdated: () => void;
  users: User[]; // All users to pick assignee from
}

const TaskList: React.FC<TaskListProps> = ({ tasks, projectId, onTaskUpdated, users }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = async () => {
    setError(null);
    if (!newTaskTitle.trim()) return;
    try {
      await taskApi.createTask({
        title: newTaskTitle,
        projectId: projectId,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      });
      setNewTaskTitle('');
      onTaskUpdated(); // Refresh tasks list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setError(null);
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.deleteTask(taskId);
      onTaskUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setError(null);
    try {
      await taskApi.updateTask(taskId, { status: newStatus });
      onTaskUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleUpdateTaskAssignee = async (taskId: string, newAssigneeId: string) => {
    setError(null);
    try {
      await taskApi.updateTask(taskId, { assigneeId: newAssigneeId === 'unassign' ? null : newAssigneeId });
      onTaskUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task assignee.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h4 className="text-xl font-semibold mb-4">Tasks</h4>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="New Task Title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateTask}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks in this project yet.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="p-4 border rounded-md bg-gray-50 flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-800">{task.title}</h5>
                <p className="text-sm text-gray-600">
                  Status:
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                    className="ml-2 border rounded px-1 py-0.5 text-xs bg-white"
                  >
                    {Object.values(TaskStatus).map((status) => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </p>
                <p className="text-sm text-gray-600">
                  Assignee:
                  <select
                    value={task.assignee?.id || 'unassign'}
                    onChange={(e) => handleUpdateTaskAssignee(task.id, e.target.value)}
                    className="ml-2 border rounded px-1 py-0.5 text-xs bg-white"
                  >
                    <option value="unassign">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </p>
                {task.dueDate && <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
              </div>
              <div className="flex space-x-2">
                {/* <button className="text-blue-500 hover:text-blue-700 text-sm">Edit</button> */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;