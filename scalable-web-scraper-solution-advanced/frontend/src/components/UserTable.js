import React from 'react';

const UserTable = ({ users, onDelete, currentUser }) => {
  if (!users || users.length === 0) {
    return <p className="text-gray-600">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">ID</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Email</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Full Name</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Role</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Active</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="py-3 px-4">{user.id}</td>
              <td className="py-3 px-4">{user.email}</td>
              <td className="py-3 px-4">{user.full_name || 'N/A'}</td>
              <td className="py-3 px-4">{user.is_superuser ? 'Admin' : 'User'}</td>
              <td className="py-3 px-4">{user.is_active ? 'Yes' : 'No'}</td>
              <td className="py-3 px-4">
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => onDelete(user.id)}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm disabled:opacity-50"
                    disabled={user.is_superuser && currentUser?.role !== 'admin'} {/* Prevent non-admin from deleting admin */}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;