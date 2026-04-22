import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import TaskCard from './TaskCard';
import { Task, TaskStatus } from '@/lib/types';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/theme/chakra.theme';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('TaskCard', () => {
  const mockTask: Task = {
    id: 'task1',
    title: 'Complete Project Report',
    description: 'Write up the final report for the Q4 project.',
    status: TaskStatus.IN_PROGRESS,
    dueDate: new Date(2024, 11, 25).toISOString(), // Dec 25, 2024
    projectId: 'proj1',
    assigneeId: 'user1',
    assignee: {
      id: 'user1',
      username: 'john_doe',
      email: 'john@example.com',
      roles: ['user'],
      createdAt: '',
      updatedAt: '',
    },
    tags: [
      { id: 'tag1', name: 'urgent', color: '#FF0000', createdAt: '', updatedAt: '' },
      { id: 'tag2', name: 'documentation', color: '#0000FF', createdAt: '', updatedAt: '' },
    ],
    createdAt: '',
    updatedAt: '',
  };

  const renderWithChakra = (component: React.ReactElement) => {
    return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
  };

  it('renders task title and description correctly', () => {
    renderWithChakra(<TaskCard task={mockTask} />);
    expect(screen.getByRole('heading', { name: /complete project report/i })).toBeInTheDocument();
    expect(screen.getByText(/write up the final report/i)).toBeInTheDocument();
  });

  it('displays the correct task status', () => {
    renderWithChakra(<TaskCard task={mockTask} />);
    expect(screen.getByText(TaskStatus.IN_PROGRESS)).toBeInTheDocument();
  });

  it('displays the due date in a readable format', () => {
    renderWithChakra(<TaskCard task={mockTask} />);
    expect(screen.getByText(/due: 12\/25\/2024/i)).toBeInTheDocument(); // Adjust date format based on locale
  });

  it('displays assignee username if present', () => {
    renderWithChakra(<TaskCard task={mockTask} />);
    expect(screen.getByText(/assigned to: john_doe/i)).toBeInTheDocument();
  });

  it('displays "No due date" if dueDate is not provided', () => {
    const taskWithoutDueDate = { ...mockTask, dueDate: undefined };
    renderWithChakra(<TaskCard task={taskWithoutDueDate} />);
    expect(screen.getByText(/no due date/i)).toBeInTheDocument();
  });

  it('displays "No description provided." if description is empty', () => {
    const taskWithoutDescription = { ...mockTask, description: '' };
    renderWithChakra(<TaskCard task={taskWithoutDescription} />);
    expect(screen.getByText(/no description provided./i)).toBeInTheDocument();
  });

  it('renders task tags', () => {
    renderWithChakra(<TaskCard task={mockTask} />);
    expect(screen.getByText(/urgent/i)).toBeInTheDocument();
    expect(screen.getByText(/documentation/i)).toBeInTheDocument();
  });

  it('links to the correct task detail page', () => {
    renderWithChakra(<TaskCard task={mockTask} />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', `/tasks/${mockTask.id}`);
  });
});