import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import TargetDatabasesList from './pages/TargetDatabases/TargetDatabasesList';
import TargetDatabaseDetail from './pages/TargetDatabases/TargetDatabaseDetail';
import AnalysisReportsList from './pages/AnalysisReports/AnalysisReportsList';
import AnalysisReportDetail from './pages/AnalysisReports/AnalysisReportDetail';
import RecommendationsList from './pages/Recommendations/RecommendationsList';
import RecommendationDetail from './pages/Recommendations/RecommendationDetail';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */} {/* Add a Register component if self-registration is enabled */}

          <Route element={<PrivateRoute roles={['ADMIN', 'USER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/target-databases" element={<TargetDatabasesList />} />
            <Route path="/target-databases/new" element={<TargetDatabaseDetail />} />
            <Route path="/target-databases/:id" element={<TargetDatabaseDetail />} />
            <Route path="/target-databases/:id/edit" element={<TargetDatabaseDetail />} />

            <Route path="/analysis-reports" element={<AnalysisReportsList />} />
            <Route path="/analysis-reports/new" element={<AnalysisReportDetail />} />
            <Route path="/analysis-reports/:id" element={<AnalysisReportDetail />} />
            <Route path="/analysis-reports/:id/edit" element={<AnalysisReportDetail />} />

            <Route path="/recommendations" element={<RecommendationsList />} />
            <Route path="/recommendations/new" element={<RecommendationDetail />} />
            <Route path="/recommendations/:id" element={<RecommendationDetail />} />
            <Route path="/recommendations/:id/edit" element={<RecommendationDetail />} />

            {/* Admin-only routes for users management - example */}
            {/* <Route element={<PrivateRoute roles={['ADMIN']} />}>
              <Route path="/users" element={<UsersList />} />
              <Route path="/users/:id" element={<UserDetail />} />
            </Route> */}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
```