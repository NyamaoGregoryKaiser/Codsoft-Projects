import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, notification, Tag, Spin, Alert, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { getUsers, updateUser, deleteUser } from '../api/users';
import { register } from '../api/auth'; // Re-use register for adding new users

const { Option } = Select;

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for new, object for edit
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to fetch users.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteUser(id);
      notification.success({ message: 'Success', description: 'User deleted successfully.' });
      fetchUsers();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to delete user.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingUser) {
        await updateUser(editingUser.id, values);
        notification.success({ message: 'Success', description: 'User updated successfully.' });
      } else {
        await register(values.username, values.email, values.password, values.role || 'user');
        notification.success({ message: 'Success', description: 'New user added successfully.' });
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to save user.',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role.toUpperCase()}</Tag>,
    },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>User Management</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add New User
      </Button>

      {loading && users.length === 0 ? (
        <Spin tip="Loading users..." />
      ) : (
        <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />
      )}

      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Invalid email' }]}>
            <Input />
          </Form.Item>
          {!editingUser && ( // Password is only required for new users
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter password' }, { min: 6, message: 'Password must be at least 6 characters' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UsersPage;