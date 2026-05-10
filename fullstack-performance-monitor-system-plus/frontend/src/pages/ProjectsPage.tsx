import React from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProjectCard from '../components/project/ProjectCard';

const ProjectsPage: React.FC = () => {
  const { projects, isLoadingProjects, isErrorProjects, errorProjects, deleteProject, isDeletingProject, deletingProjectId } = useProjects();

  if (isLoadingProjects) {
    return <LoadingSpinner className="h-48" />;
  }

  if (isErrorProjects) {
    return <div className="text-danger">Error: {errorProjects?.message}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text dark:text-dark-text">Your Projects</h1>
        <Link to="/projects/new">
          <Button>Create New Project</Button>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteProject}
              isDeleting={isDeletingProject}
              deletingId={deletingProjectId as string | null}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            You don't have any projects yet.
          </p>
          <Link to="/projects/new">
            <Button>Create Your First Project</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
```

```