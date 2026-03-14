```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../../src/pages/LoginPage';
import { AuthContext } from '../../src/contexts/AuthContext'; // Import AuthContext
import { act } from 'react-dom/test-utils';

// Mock the AuthContext provider
const mockLogin = jest.fn();
const mockAuthContextValue = {
    isAuthenticated: false,
    loading: false,
    error: null,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
    socket: null,
    setUser: jest.fn(),
};

describe('LoginPage', () => {
    beforeEach(() => {
        mockLogin.mockClear(); // Clear mock calls before each test
    });

    it('renders login form correctly', () => {
        render(
            <Router>
                <AuthContext.Provider value={mockAuthContextValue}>
                    <LoginPage />
                </AuthContext.Provider>
            </Router>
        );

        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/username\/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    });

    it('calls login function on form submission with correct credentials', async () => {
        render(
            <Router>
                <AuthContext.Provider value={mockAuthContextValue}>
                    <LoginPage />
                </AuthContext.Provider>
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/username\/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /login/i }));
        });


        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('displays error message if login fails', () => {
        const errorAuthContextValue = {
            ...mockAuthContextValue,
            error: 'Invalid credentials.',
        };

        render(
            <Router>
                <AuthContext.Provider value={errorAuthContextValue}>
                    <LoginPage />
                </AuthContext.Provider>
            </Router>
        );

        expect(screen.getByText('Invalid credentials.')).toBeInTheDocument();
    });

    it('disables form fields and button when loading', () => {
        const loadingAuthContextValue = {
            ...mockAuthContextValue,
            loading: true,
        };

        render(
            <Router>
                <AuthContext.Provider value={loadingAuthContextValue}>
                    <LoginPage />
                </AuthContext.Provider>
            </Router>
        );

        expect(screen.getByLabelText(/username\/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/password/i)).toBeDisabled();
        expect(screen.getByRole('button', { name: /loading.../i })).toBeDisabled();
    });
});
```