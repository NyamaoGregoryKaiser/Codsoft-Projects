```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import LoginPage from '@pages/Auth/LoginPage';
import RegisterPage from '@pages/Auth/RegisterPage';
import HomePage from '@pages/HomePage';
import ProductListPage from '@pages/Products/ProductListPage';
import ProductDetailsPage from '@pages/Products/ProductDetailsPage';
import AddEditProductPage from '@pages/Products/AddEditProductPage';
import CategoryListPage from '@pages/Categories/CategoryListPage';
import AddEditCategoryPage from '@pages/Categories/AddEditCategoryPage';
import UserListPage from '@pages/Users/UserListPage';
import PrivateRoute from '@components/Auth/PrivateRoute';
import AdminRoute from '@components/Auth/AdminRoute';
import { UserRole } from '@types-frontend/enums';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes - require authentication */}
            <Route path="/products" element={<PrivateRoute roles={[UserRole.USER, UserRole.ADMIN]}><ProductListPage /></PrivateRoute>} />
            <Route path="/products/:id" element={<PrivateRoute roles={[UserRole.USER, UserRole.ADMIN]}><ProductDetailsPage /></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute roles={[UserRole.USER, UserRole.ADMIN]}><CategoryListPage /></PrivateRoute>} />

            {/* Admin Routes - require ADMIN role */}
            <Route path="/products/new" element={<AdminRoute><AddEditProductPage /></AdminRoute>} />
            <Route path="/products/edit/:id" element={<AdminRoute><AddEditProductPage /></AdminRoute>} />
            <Route path="/categories/new" element={<AdminRoute><AddEditCategoryPage /></AdminRoute>} />
            <Route path="/categories/edit/:id" element={<AdminRoute><AddEditCategoryPage /></AdminRoute>} />
            <Route path="/users" element={<AdminRoute><UserListPage /></AdminRoute>} />
            
            {/* Catch-all for 404 - simple text message */}
            <Route path="*" element={<h1 className="text-2xl font-bold text-center mt-8">404 - Page Not Found</h1>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
```