import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@api/users';
import Table from '@components/Table';
import { User, UserCreate, UserUpdate } from '@types';
import { UserRole } from '@types/auth';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@hooks/useAuth';
import AuthGuard from '@components/AuthGuard';

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.isAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserCreate | UserUpdate>({
    username: '',
    email: '',
    fullName: '',
    is_active: true,
    is_admin: false,
    role: UserRole.USER,
    password: '',
  });

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isAdmin, // Only fetch if current user is admin
  });

  const createUserMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => alert(`Error creating user: ${err.message}`),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UserUpdate }) =>
      usersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
    },
    onError: (err: Error) => alert(`Error updating user: ${err.message}`),
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => alert(`Error deleting user: ${err.message}`),
  });

  const handleCreateNew = () => {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      is_active: user.isActive,
      is_admin: user.isAdmin,
      role: user.role,
      password: '', // Password is not returned, user must re-enter if changing
    });
    setIsModalOpen(true);
  };

  const handleDelete = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password; // Don't send empty password if not changed
    }

    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.id, data: payload });
    } else {
      createUserMutation.mutate(payload as UserCreate);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      fullName: '',
      is_active: true,
      is_admin: false,
      role: UserRole.USER,
      password: '',
    });
  };

  const columns = [
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Full Name', accessor: (row: User) => row.fullName || 'N/A' },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Active',
      accessor: (row: User) => (
        row.isActive ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <XCircleIcon className="w-6 h-6 text-red-500" />
      ),
      className: 'text-center'