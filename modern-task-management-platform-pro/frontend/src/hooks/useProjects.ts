```typescript
import { useState, useEffect, useCallback } from 'react';
import { Project, PaginatedResponse } from 'types';
import * as projectApi from 'api/projects';
import { useAuth } from 'contexts/AuthContext';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: (page?: number, limit?: number) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project | undefined>;
  updateProject: (id: string, name?: string, description?: string) => Promise<Project | undefined>;
  deleteProject: (id: string) => Promise<void>;
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export const useProjects = (initialPage = 1, initialLimit = 10): UseProjectsResult => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: initialLimit,
    page: initialPage,
    totalPages: 0,
  });

  const fetchProjects = useCallback(async (page = pagination.page, limit = pagination.limit) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await projectApi.getProjects(page, limit);
      if (res.success && res.data) {
        setProjects(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch projects.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pagination.page, pagination.limit]);

  const createProject = async (name: string, description?: string): Promise<Project | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectApi.createProject({ name, description });
      if (res.success && res.data) {
        setProjects((prev) => [res.data!, ...prev]); // Add new project to the top
        await fetchProjects(); // Refresh projects to ensure pagination is correct
        return res.data;
      } else {
        setError(res.message || 'Failed to create project.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const updateProject = async (id: string, name?: string, description?: string): Promise<Project | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectApi.updateProject(id, { name, description });
      if (res.success && res.data) {
        setProjects((prev) => prev.map((p) => (p.id === id ? res.data! : p)));
        return res.data;
      } else {
        setError(res.message || 'Failed to update project.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectApi.deleteProject(id);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        await fetchProjects(); // Refresh projects to ensure pagination is correct
      } else {
        setError(res.message || 'Failed to delete project.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    pagination,
  };
};
```