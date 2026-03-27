import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Projects from './pages/Projects';
import ProtectedRoute from './components/ProtectedRoute';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'member';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: User, accessToken: string) => {
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('accessToken', accessToken);
    setUser(loggedInUser);
    navigate('/projects');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setUser(null);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600">PMS</Link>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username} ({user.role})</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded">
              Login / Register
            </Link>
          )}
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
          <Route path="/" element={<ProtectedRoute user={user}><Projects user={user} /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute user={user}><Projects user={user} /></ProtectedRoute>} />
          {/* Add more routes here for tasks, user management etc. */}
        </Routes>
      </main>
    </div>
  );
}

export default App;