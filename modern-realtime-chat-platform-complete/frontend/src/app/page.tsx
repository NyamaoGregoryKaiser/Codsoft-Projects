'use client';

import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/chat'); // Redirect to chat if already logged in
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Loading authentication...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Welcome to Real-time Chat
        </h1>
        {isRegistering ? (
          <RegisterForm onSuccess={() => setIsRegistering(false)} />
        ) : (
          <LoginForm />
        )}
        <p className="mt-6 text-center text-sm">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegistering(false)}
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setIsRegistering(true)}
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}