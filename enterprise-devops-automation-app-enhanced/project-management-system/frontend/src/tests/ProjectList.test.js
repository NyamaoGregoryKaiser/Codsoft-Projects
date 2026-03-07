```javascript
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ProjectListPage from '../pages/ProjectList';
import { AuthProvider } from '../contexts/AuthContext';
import * as projectApi from '../api/projects';

// Mock projectApi
jest.mock('../api/projects');

const mockProjects = [
  { id: 'proj1', name: 'Project Alpha', description: 'Desc 1', status: 'active', owner: { name: 'Owner 1' }, members: [{id:'user1'}] },
  { id: 'proj2', name: 'Project Beta', description: 'Desc 2', status: 'pending', owner: { name: 'Owner 2' }, members: [{id:'user1'}] },
];

const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
};

const renderProjectListPage = (user = mockUser) => {
    // Mock localStorage to simulate a logged-in user
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tokens', JSON.stringify({access:{token:'abc', expires:new Date(Date.now() + 3600000).toISOString()}}));

    return render(
        <Router>
            <AuthProvider>
                <ProjectListPage />
            </AuthProvider>
        </Router>
    );
};

describe('ProjectListPage', () => {
  beforeEach(() => {
    projectApi.getProjects.mockReset();
    projectApi.createProject.mockReset();
    localStorage.clear(); // Clear local storage before each test
    jest.clearAllMocks();
  });

  test('displays loading message initially', () => {
    projectApi.getProjects.mockReturnValue(new Promise(() => {})); // Never resolve to keep loading
    renderProjectListPage();
    expect(screen.getByText(/loading projects.../i)).toBeInTheDocument();
  });

  test('displays projects after successful fetch', async () => {
    projectApi.getProjects.mockResolvedValueOnce({ data: mockProjects });
    renderProjectListPage();

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });
  });

  test('displays "No projects found" if fetch returns empty array', async () => {
    projectApi.getProjects.mockResolvedValueOnce({ data: [] });
    renderProjectListPage();

    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
    });
  });

  test('displays error message on failed project fetch', async () => {
    projectApi.getProjects.mockRejectedValueOnce(new Error('Network Error'));
    renderProjectListPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load projects\. please try again\./i)).toBeInTheDocument();
    });
  });

  test('allows creating a new project', async () => {
    projectApi.getProjects.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
      data: [...mockProjects, { id: 'proj3', name: 'New Project', description: 'New Desc', status: 'pending', owner: { name: 'Test User' }, members: [{id:'user1'}] }]
    });
    projectApi.createProject.mockResolvedValueOnce({
      data: { id: 'proj3', name: 'New Project', description: 'New Desc', status: 'pending', ownerId: mockUser.id }
    });

    renderProjectListPage();

    fireEvent.change(screen.getByPlaceholderText('Project Name'), { target: { value: 'New Project' } });
    fireEvent.change(screen.getByPlaceholderText('Project Description (optional)'), { target: { value: 'New Desc' } });
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(projectApi.createProject).toHaveBeenCalledWith({ name: 'New Project', description: 'New Desc' });
      expect(projectApi.getProjects).toHaveBeenCalledTimes(2); // Initial fetch + refresh after creation
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  test('shows alert if project name is empty when creating', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderProjectListPage();

    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Project name cannot be empty.');
      expect(projectApi.createProject).not.toHaveBeenCalled();
    });
    alertMock.mockRestore();
  });
});
```