import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoadingProjects, isErrorProjects } = useProjects();

  if (isLoadingProjects) {
    return <LoadingSpinner className="h-48" />;
  }

  if (isErrorProjects) {
    return <div className="text-danger">Failed to load projects.</div>;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-text dark:text-dark-text mb-6">Welcome, {user?.name || 'User'}!</h1>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-text dark:text-dark-text">Your Projects</h2>
          <Link to="/projects/new">
            <Button>Create New Project</Button>
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((project) => ( // Show top 3 projects on dashboard
              <Card key={project.id}>
                <h3 className="text-xl font-semibold text-primary dark:text-secondary mb-2">{project.name}</h3>
                <p className="text-gray-600 dark:text-gray-300">ID: {project.id.substring(0, 8)}...</p>
                <Link to={`/projects/${project.id}`} className="mt-4 inline-block">
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400">
              You don't have any projects yet. Start by creating one!
            </p>
            <div className="mt-4 text-center">
              <Link to="/projects/new">
                <Button>Create First Project</Button>
              </Link>
            </div>
          </Card>
        )}
        {projects && projects.length > 3 && (
          <div className="mt-6 text-center">
            <Link to="/projects">
              <Button variant="secondary">View All Projects</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Future sections like global insights, alerts summary etc. */}
      {/* <section className="mb-8">
        <h2 className="text-2xl font-semibold text-text dark:text-dark-text mb-4">Global Insights</h2>
        <Card>
          <p>Global statistics or recent activities across all your projects.</p>
        </Card>
      </section> */}
    </div>
  );
};

export default DashboardPage;
```

```