import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import { CartProvider } from './context/CartContext'; // Would be implemented
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage'; // Would be implemented
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/Common/PrivateRoute'; // A component to protect routes
// import CartPage from './pages/CartPage'; // Would be implemented
// import CheckoutPage from './pages/CheckoutPage'; // Would be implemented
// import OrderHistoryPage from './pages/OrderHistoryPage'; // Would be implemented
// import AdminDashboard from './pages/AdminDashboard'; // Would be implemented

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                {/* <CartProvider> */}
                    <div className="flex flex-col min-h-screen bg-gray-100">
                        <Header />
                        <main className="flex-grow container mx-auto p-4">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/products" element={<ProductsPage />} />
                                <Route path="/products/:id" element={<ProductDetailPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />

                                {/* Protected Routes */}
                                {/* <Route element={<PrivateRoute allowedRoles={['CUSTOMER', 'ADMIN']} />}>
                                    <Route path="/cart" element={<CartPage />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/orders" element={<OrderHistoryPage />} />
                                </Route>
                                <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                                    <Route path="/admin/*" element={<AdminDashboard />} />
                                </Route> */}

                                {/* Catch all for 404 */}
                                <Route path="*" element={<h1 className="text-center text-3xl mt-20">404 - Page Not Found</h1>} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                {/* </CartProvider> */}
            </AuthProvider>
        </Router>
    );
};

export default App;