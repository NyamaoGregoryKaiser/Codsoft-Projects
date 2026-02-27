import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../Common/Button'; // Assuming a Button component

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-teal-300 hover:text-teal-400 transition-colors">
                    E-Shop
                </Link>
                <nav className="flex space-x-6 items-center">
                    <Link to="/products" className="hover:text-gray-300 transition-colors">Products</Link>
                    <Link to="/cart" className="hover:text-gray-300 transition-colors">Cart</Link>
                    {isAuthenticated ? (
                        <>
                            <span className="text-sm">Hello, {user?.firstName} ({user?.role})</span>
                            {user?.role === 'ADMIN' && (
                                <Link to="/admin/products" className="hover:text-gray-300 transition-colors">Admin</Link>
                            )}
                            <Button onClick={handleLogout} variant="secondary" size="sm">Logout</Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-gray-300 transition-colors">Login</Link>
                            <Link to="/register" className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition-colors">Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;