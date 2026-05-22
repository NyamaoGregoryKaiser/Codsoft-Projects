```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import ProjectsList from '@/pages/projects/ProjectsList';
import ProjectDetail from '@/pages/projects/ProjectDetail';
import DatasetsList from '@/pages/datasets/DatasetsList';
import ModelsList from '@/pages/models/ModelsList';
import ExperimentsList from '@/pages/experiments/ExperimentsList';
import NotFound from '@/components/common/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '@/components/common/AppLayout';
import UsersList from '@/pages/users/UsersList';
import ModelInference from '@/pages/models/ModelInference';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/datasets" element={<DatasetsList />} />
              <Route path="/models" element={<ModelsList />} />
              <Route path="/models/:id/inference" element={<ModelInference />} />
              <Route path="/experiments" element={<ExperimentsList />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AppLayout />}>
                <Route path="/admin/users" element={<UsersList />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;
```