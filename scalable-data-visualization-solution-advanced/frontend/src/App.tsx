```tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { LoginPage } from './auth/components/Login';
import { RegisterPage } from './auth/components/Register';
import { HomePage } from './pages/HomePage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { VisualizationsPage } from './pages/VisualizationsPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomePage />} />
        <Route path="data-sources" element={<DataSourcesPage />} />
        <Route path="data-sources/:id" element={<DataSourcesPage />} /> {/* For editing */}
        <Route path="datasets" element={<DatasetsPage />} />
        <Route path="datasets/:id" element={<DatasetsPage />} />
        <Route path="visualizations" element={<VisualizationsPage />} />
        <Route path="visualizations/:id" element={<VisualizationsPage />} />
        <Route path="dashboards" element={<DashboardsPage />} />
        <Route path="dashboards/:id" element={<DashboardsPage />} />
        {/* Add more private routes here */}
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
```