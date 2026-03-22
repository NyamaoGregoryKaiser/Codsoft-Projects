```javascript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const TaskForm = ({ projectId, task, projectMembers = [], allProjects = [], onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '', // Pre-fill if creating task within a project detail page
    assigneeId: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [currentProjectMembers, setCurrentProjectMembers] = useState(projectMembers);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.projectId,
        assigneeId: task.assigneeId || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        projectId: projectId || '',
        assigneeId: '',
        dueDate: '',
      }));
    }
  }, [task, projectId]);

  // Update project members if selected projectId changes (only when creating a new task and selecting project)
  useEffect(() => {
    if (!task && formData.projectId && allProjects.length > 0) {
      const selectedProject = allProjects.find(p => p.id === formData.projectId);
      if (selectedProject) {
        setCurrentProjectMembers(selectedProject.members);
      } else {
        setCurrentProjectMembers([]);
      }
    } else if (task) {
      setCurrentProjectMembers(projectMembers);
    }
  }, [formData.projectId, task, allProjects, projectMembers]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSend = { ...formData };

    // Format dueDate to ISO string or null
    dataToSend.dueDate = dataToSend.dueDate ? dayjs(dataToSend.dueDate).toISOString() : null;
    // Ensure assigneeId is null if empty string
    dataToSend.assigneeId = dataToSend.assigneeId || null;

    try {
      if (task) {
        await api.patch(`/tasks/${task.id}`, dataToSend);
        toast.success('Task updated successfully!');
      } else {
        await api.post('/tasks', dataToSend);
        toast.success('Task created successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(`Failed to ${task ? 'update' : 'create'} task.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          id="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        ></textarea>
      </div>
      <div>
        <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project</label>
        <select
          name="projectId"
          id="projectId"
          value={formData.projectId}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
          disabled={!!task} // Cannot change project of an existing task easily via this form
        >
          <option value="">Select Project</option>
          {(task ? [task.project] : allProjects).map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assignee</label>
        <select
          name="assigneeId"
          id="assigneeId"
          value={formData.assigneeId}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          <option value="">Unassigned</option>
          {currentProjectMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.firstName} {member.lastName} ({member.email})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            name="priority"
            id="priority"
            value={formData.priority}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="date"
          name="dueDate"
          id="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? (task ? 'Updating...' : 'Creating...') : (task ? 'Update Task' : 'Create Task')}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
```