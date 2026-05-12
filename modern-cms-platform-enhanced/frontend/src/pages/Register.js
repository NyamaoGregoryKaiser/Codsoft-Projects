```javascript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import { CubeIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer', // Default role
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
    } catch (error) {
      // Error handled by AuthContext and toast
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <CubeIcon className="mx-auto h-12 w-auto text-primary" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="username"
            label="Username"
            type="text"
            required
            placeholder="JohnDoe"
            value={formData.username}
            onChange={handleChange}
          />
          <Input
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            placeholder="john.doe@example.com"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="********"
            value={formData.password}
            onChange={handleChange}
          />
          <Select
            id="role"
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={handleChange}
          />

          <Button type="submit" loading={loading} className="w-full">
            Register
          </Button>
        </form>
        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-primary hover:text-secondary">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
```