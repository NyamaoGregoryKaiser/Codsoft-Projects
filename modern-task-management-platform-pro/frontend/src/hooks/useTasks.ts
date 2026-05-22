```typescript
import { useState, useEffect, useCallback } from 'react';
import { Task, PaginatedResponse, TaskStatus, TaskPriority } from 'types';
import * as taskApi from 'api/tasks';
import { useAuth } from 'contexts/AuthContext';

interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (projectId: string, page?: number, limit?: number) => Promise<void>;
  createTask: (projectId: string, payload: CreateTaskPayload) => Promise<Task | undefined>;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<Task | undefined>;
  deleteTask: (taskId: string) => Promise<void>;
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export const useTasks = (initialPage = 1, initialLimit = 10): UseTasksResult => {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: initialLimit,
    page: initialPage,
    totalPages: 0,
  });

  const fetchTasks = useCallback(async (projectId: string, page = pagination.page, limit = pagination.limit) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.getTasksByProject(projectId, page, limit);
      if (res.success && res.data) {
        setTasks(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch tasks.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pagination.page, pagination.limit]);

  const createTask = async (projectId: string, payload: CreateTaskPayload): Promise<Task | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.createTask(projectId, payload);
      if (res.success && res.data) {
        setTasks((prev) => [res.data!, ...prev]);
        await fetchTasks(projectId); // Refresh tasks to ensure pagination is correct
        return res.data;
      } else {
        setError(res.message || 'Failed to create task.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const updateTask = async (taskId: string, payload: UpdateTaskPayload): Promise<Task | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.updateTask(taskId, payload);
      if (res.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data! : t)));
        return res.data;
      } else {
        setError(res.message || 'Failed to update task.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.deleteTask(taskId);
      if (res.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        // No need to fetch all tasks if only deleting one from a filtered list.
        // If this hook needs to display global tasks (not project-specific), then a full refresh would be needed.
      } else {
        setError(res.message || 'Failed to delete task.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch is typically triggered by a specific project ID once it's available.
  // This hook is usually consumer-driven, so no useEffect here by default for `fetchTasks`
  // as the `projectId` might not be immediately available.

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    pagination,
  };
};
```