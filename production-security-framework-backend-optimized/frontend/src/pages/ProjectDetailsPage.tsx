```typescript
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { projects as projectsApi } from '../api/projects';
import { tasks as tasksApi } from '../api/tasks';
import { users as usersApi } from '../api/users';
import { Project, Task, User, CreateTaskData, UpdateTaskData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ProjectForm from '../components/forms/ProjectForm';
import TaskForm from '../components/forms/TaskForm';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();