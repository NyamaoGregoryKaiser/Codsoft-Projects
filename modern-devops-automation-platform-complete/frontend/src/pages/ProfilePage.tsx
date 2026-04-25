```typescript
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/api/auth';
import { User, Project, Task } from '@/utils/types';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const fetchedProfile = await getUserProfile();
          setProfile(fetchedProfile);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch profile.');
          toast.error('Failed to load profile.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user?.id]);

  if (loading) {
    return <div className="text-center text-lg">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center text-lg">No profile data available.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Details */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-600">Account Information</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Username:</span> {profile.username}
            </p>
            <p>
              <span className="font-medium">Email:</span> {profile.email}
            </p>
            <p>
              <span className="font-medium">Member Since:</span> {dayjs(profile.createdAt).format('MMMM D, YYYY')}
            </p>
          </div>
        </div>

        {/* Projects */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-600">My Projects ({profile.projects.length})</h2>
          {profile.projects.length > 0 ? (
            <ul className="space-y-2">
              {profile.projects.map((project: Project) => (
                <li key={project.id} className="border-b border-gray-200 pb-2">
                  <p className="font-medium text-lg">{project.name}</p>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No projects created yet.</p>
          )}
        </div>

        {/* Tasks Assigned */}
        <div className="card md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-600">Tasks Assigned to Me ({profile.tasks.length})</h2>
          {profile.tasks.length > 0 ? (
            <ul className="space-y-2">
              {profile.tasks.map((task: Task) => (
                <li key={task.id} className="border-b border-gray-200 pb-2">
                  <p className="font-medium text-lg">{task.title}</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-semibold ${task.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{task.status}</span>
                    {task.dueDate && ` | Due: ${dayjs(task.dueDate).format('MMM D, YYYY HH:mm')}`}
                    {task.project && ` | Project: ${task.project.name}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No tasks currently assigned to you.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
```