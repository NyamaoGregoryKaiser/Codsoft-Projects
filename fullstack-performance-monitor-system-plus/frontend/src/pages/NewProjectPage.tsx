import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const NewProjectPage: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { createProject, isCreatingProject } = useProjects();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (projectName.length < 3) {
      setFormError('Project name must be at least 3 characters long.');
      return;
    }

    createProject(projectName, {
      onSuccess: () => {
        navigate('/projects');
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || 'Failed to create project.';
        setFormError(message);
      }
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-3xl font-bold text-text dark:text-dark-text">Create New Project</h1>
      </div>

      <Card className="max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && <div className="text-danger text-center">{formError}</div>}
          <Input
            id="projectName"
            label="Project Name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            placeholder="e.g., My Awesome Web App"
            error={formError}
          />
          <Button type="submit" isLoading={isCreatingProject} disabled={isCreatingProject} className="w-full">
            Create Project
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default NewProjectPage;
```

```