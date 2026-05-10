import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/api-client';
import { Project } from '../types';
import { useToast } from '../contexts/ToastContext';

// --- API Calls ---
const fetchProjects = async (): Promise<Project[]> => {
  const response = await apiClient.get('/projects');
  return response.data.data.projects;
};

const createProject = async (name: string): Promise<Project> => {
  const response = await apiClient.post('/projects', { name });
  return response.data.data.project;
};

const deleteProject = async (projectId: string): Promise<void> => {
  await apiClient.delete(`/projects/${projectId}`);
};

// --- Hooks ---
export const useProjects = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching all projects
  const { data: projects, isLoading, isError, error } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Mutation for creating a project
  const createProjectMutation = useMutation<Project, Error, string>({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      addToast('Project created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Invalidate and refetch projects list
      queryClient.setQueryData(['project', newProject.id], newProject); // Add new project to cache
    },
    onError: (err) => {
      addToast(`Error creating project: ${err.message}`, 'error');
    },
  });

  // Mutation for deleting a project
  const deleteProjectMutation = useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: (_, projectId) => {
      addToast('Project deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Invalidate and refetch projects list
      queryClient.removeQueries({ queryKey: ['project', projectId] }); // Remove deleted project from cache
      queryClient.removeQueries({ queryKey: ['metrics', projectId] }); // Invalidate associated metrics
    },
    onError: (err) => {
      addToast(`Error deleting project: ${err.message}`, 'error');
    },
  });

  return {
    projects,
    isLoadingProjects: isLoading,
    isErrorProjects: isError,
    errorProjects: error,
    createProject: createProjectMutation.mutate,
    isCreatingProject: createProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeletingProject: deleteProjectMutation.isPending,
    deletingProjectId: deleteProjectMutation.variables, // Pass the ID of the project being deleted
  };
};

export const useProject = (projectId: string) => {
  const { addToast } = useToast();

  // Query for fetching a single project
  const { data: project, isLoading, isError, error } = useQuery<Project, Error>({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}`).then(res => res.data.data.project),
    enabled: !!projectId, // Only run if projectId is available
    onError: (err) => {
      addToast(`Error fetching project: ${err.message}`, 'error');
    },
  });

  return {
    project,
    isLoadingProject: isLoading,
    isErrorProject: isError,
    errorProject: error,
  };
};
```

```