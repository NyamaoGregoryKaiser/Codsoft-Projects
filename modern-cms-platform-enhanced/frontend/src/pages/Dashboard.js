```javascript
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, userRole } = useAuth();

  const dashboardCards = [
    {
      title: 'Manage Content Types',
      description: 'Define and structure your content schemas.',
      icon: CubeIcon,
      link: '/content-types',
      roles: ['admin']
    },
    {
      title: 'Browse Entries',
      description: 'View and manage all your content entries.',
      icon: DocumentTextIcon,
      link: '/entries',
      roles: ['admin', 'editor', 'viewer']
    },
    {
      title: 'Media Library',
      description: 'Upload and organize your images and files.',
      icon: PhotoIcon,
      link: '/media',
      roles: ['admin', 'editor']
    },
    {
      title: 'User Management',
      description: 'Add, edit, and delete users and their roles.',
      icon: UsersIcon,
      link: '/users',
      roles: ['admin']
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-6">Welcome, {user?.username || 'Guest'}!</h1>
      <p className="text-lg text-gray-600 mb-8">Role: <span className="font-semibold capitalize">{userRole}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.filter(card => card.roles.includes(userRole)).map((card, index) => (
          <Link to={card.link} key={index} className="block">
            <div className="bg-white overflow-hidden shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <card.icon className="h-10 w-10 text-primary mr-4" />
                <h2 className="text-xl font-semibold text-gray-900">{card.title}</h2>
              </div>
              <p className="text-gray-600">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
```