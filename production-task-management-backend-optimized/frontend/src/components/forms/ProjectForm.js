```javascript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ProjectForm = ({ project, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // For member selection

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        memberIds: project.members.map(member => member.id),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        memberIds: [],
      });
    }
  }, [project]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await api.get('/users?limit=1000'); // Fetch all users, or use pagination
        setAllUsers(response.data.users);
      } catch (error) {
        toast.error('Failed to load users for member selection.');
        console.error('Error fetching all users:', error);
      }
    };
    fetchAllUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMemberChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, memberIds: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (project) {
        await api.patch(`/projects/${project.id}`, formData);
        toast.success('Project updated successfully!');
      } else {
        await api.post('/projects', formData);
        toast.success('Project created successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(`Failed to ${project ? 'update' : 'create'} project.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
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
        <label htmlFor="memberIds" className="block text-sm font-medium text-gray-700">Members (Ctrl/Cmd + Click to select multiple)</label>
        <select
          multiple
          name="memberIds"
          id="memberIds"
          value={formData.memberIds}
          onChange={handleMemberChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-32"
        >
          {allUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.email})
            </option>
          ))}
        </select>
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
          {loading ? (project ? 'Updating...' : 'Creating...') : (project ? 'Update Project' : 'Create Project')}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
```