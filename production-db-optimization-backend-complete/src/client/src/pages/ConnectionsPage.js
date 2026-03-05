import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, notification, Tag, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudUploadOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import {
  createConnection,
  getConnections,
  updateConnection,
  deleteConnection,
  testConnection as apiTestConnection,
} from '../api/connections';

function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null); // null for new, object for edit
  const [form] = Form.useForm();
  const [testingConnectionId, setTestingConnectionId] = useState(null); // Tracks which connection is being tested

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await getConnections();
      setConnections(data);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch connections.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAdd = () => {
    setEditingConnection(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingConnection(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteConnection(id);
      notification.success({ message: 'Success', description: 'Connection deleted successfully.' });
      fetchConnections();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to delete connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (id) => {
    setTestingConnectionId(id);
    try {
      await apiTestConnection(id);
      notification.success({ message: 'Success', description: 'Connection test successful!' });
    } catch (error) {
      notification.error({
        message: 'Connection Test Failed',
        description: error.response?.data?.message || 'Could not connect to the database. Check details.',
      });
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingConnection) {
        await updateConnection(editingConnection.id, values);
        notification.success({ message: 'Success', description: 'Connection updated successfully.' });
      } else {
        await createConnection(values);
        notification.success({ message: 'Success', description: 'Connection added successfully.' });
      }
      setModalVisible(false);
      fetchConnections();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to save connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Host', dataIndex: 'host', key: 'host' },
    { title: 'Port', dataIndex: 'port', key: 'port' },
    { title: 'User', dataIndex: 'user', key: 'user' },
    { title: 'Database', dataIndex: 'database', key: 'database' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<CloudUploadOutlined />} onClick={() => handleTestConnection(record.id)} loading={testingConnectionId === record.id}>
            Test
          </Button>
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
      <h2 style={{ marginBottom: 24 }}>Database Connections</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add New Connection
      </Button>

      {loading && connections.length === 0 ? (
        <Spin tip="Loading connections..." />
      ) : (
        <Table dataSource={connections} columns={columns} rowKey="id" loading={loading} />
      )}

      <Modal
        title={editingConnection ? 'Edit Connection' : 'Add New Connection'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Connection Name" rules={[{ required: true, message: 'Please enter connection name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="host" label="Host" rules={[{ required: true, message: 'Please enter host' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="port" label="Port" rules={[{ required: true, message: 'Please enter port' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="user" label="User" rules={[{ required: true, message: 'Please enter user' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: editingConnection ? false : true, message: 'Please enter password' }]}>
            <Input.Password placeholder={editingConnection ? 'Leave blank to keep current password' : 'Password'} />
          </Form.Item>
          <Form.Item name="database" label="Database Name" rules={[{ required: true, message: 'Please enter database name' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ConnectionsPage;