'use client';

import AuthForm from '../components/AuthForm';
import { useAuth } from './layout'; // Import useAuth from layout
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/profile'); // Redirect to profile if already authenticated
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return <p className="text-center text-lg mt-8">Redirecting to profile...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Auth System</h1>
      <AuthForm />
    </div>
  );
}
```

### `frontend/src/app/profile/page.js`
```javascript