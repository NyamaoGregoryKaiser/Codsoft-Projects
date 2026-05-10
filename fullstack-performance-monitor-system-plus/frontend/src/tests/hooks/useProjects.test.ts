import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects, useProject } from '../../hooks/useProjects';
import apiClient from '../../api/api-client';
import { ToastProvider } from '../../contexts/ToastContext';
import React from 'react';

// Mock the API client
jest.mock('../../api/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>{children}</ToastProvider>
  </QueryClientProvider>
);

describe('useProjects hook', () => {
  beforeEach(() => {
    queryClient.clear(); // Clear cache between tests
    mockedApiClient.get.mockReset();
    mockedApiClient.post.mockReset();
    mockedApiClient.delete.mockReset();
  });

  it('fetches projects successfully', async () => {
    const mockProjects = [
      { id: 'p1', name: 'Project One', apikey: 'key1', ownerId: 'u1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: 'p2', name: 'Project Two', apikey: 'key2', ownerId: 'u1', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
    ];
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { projects: mockProjects } } });

    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.isLoadingProjects).toBe(true);

    await waitFor(() => expect(result.current.isLoadingProjects).toBe(false));

    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.isErrorProjects).toBe(false);
  });

  it('handles error when fetching projects', async () => {
    const errorMessage = 'Failed to fetch';
    mockedApiClient.get.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingProjects).toBe(false));

    expect(result.current.projects).toBeUndefined();
    expect(result.current.isErrorProjects).toBe(true);
    expect(result.current.errorProjects?.message).toBe(errorMessage);
  });

  it('creates a project successfully', async () => {
    const newProject = { id: 'p3', name: 'New Project', apikey: 'key3', ownerId: 'u1', createdAt: '2023-01-03', updatedAt: '2023-01-03' };
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: { project: newProject } } });
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { projects: [newProject] } } }); // For invalidation

    const { result } = renderHook(() => useProjects(), { wrapper });

    result.current.createProject('New Project');

    expect(result.current.isCreatingProject).toBe(true);

    await waitFor(() => expect(result.current.isCreatingProject).toBe(false));

    expect(mockedApiClient.post).toHaveBeenCalledWith('/projects', { name: 'New Project' });
    // Verify that projects query is invalidated (leading to a refetch)
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/projects'));
    expect(result.current.projects).toEqual([newProject]); // Should now reflect the new project after refetch
  });

  it('deletes a project successfully', async () => {
    const projectIdToDelete = 'p1';
    mockedApiClient.delete.mockResolvedValueOnce({});
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { projects: [] } } }); // For invalidation

    const { result } = renderHook(() => useProjects(), { wrapper });

    // Simulate having projects initially
    queryClient.setQueryData(['projects'], [{ id: projectIdToDelete, name: 'Project One', apikey: 'key1', ownerId: 'u1', createdAt: '2023-01-01', updatedAt: '2023-01-01' }]);

    result.current.deleteProject(projectIdToDelete);

    expect(result.current.isDeletingProject).toBe(true);
    expect(result.current.deletingProjectId).toBe(projectIdToDelete);

    await waitFor(() => expect(result.current.isDeletingProject).toBe(false));

    expect(mockedApiClient.delete).toHaveBeenCalledWith(`/projects/${projectIdToDelete}`);
    // Verify that projects query is invalidated (leading to a refetch)
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith('/projects'));
    expect(result.current.projects).toEqual([]); // Should now be empty after refetch
  });
});

describe('useProject hook', () => {
  beforeEach(() => {
    queryClient.clear();
    mockedApiClient.get.mockReset();
  });

  it('fetches a single project successfully', async () => {
    const mockProject = { id: 'p1', name: 'Project One', apikey: 'key1', ownerId: 'u1', createdAt: '2023-01-01', updatedAt: '2023-01-01' };
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { project: mockProject } } });

    const { result } = renderHook(() => useProject('p1'), { wrapper });

    expect(result.current.isLoadingProject).toBe(true);

    await waitFor(() => expect(result.current.isLoadingProject).toBe(false));

    expect(result.current.project).toEqual(mockProject);
    expect(result.current.isErrorProject).toBe(false);
  });

  it('handles error when fetching a single project', async () => {
    const errorMessage = 'Project not found';
    mockedApiClient.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    const { result } = renderHook(() => useProject('nonexistent-id'), { wrapper });

    await waitFor(() => expect(result.current.isLoadingProject).toBe(false));

    expect(result.current.project).toBeUndefined();
    expect(result.current.isErrorProject).toBe(true);
    expect(result.current.errorProject?.message).toBe(errorMessage);
  });

  it('does not fetch if projectId is empty', async () => {
    const { result } = renderHook(() => useProject(''), { wrapper });

    expect(result.current.isLoadingProject).toBe(false);
    expect(result.current.project).toBeUndefined();
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });
});
```

```