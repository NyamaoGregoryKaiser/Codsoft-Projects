import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography, Popconfirm, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as projectService from '../services/project';
import { useAuth } from '../hooks/useAuth';

const { Title } = Typography;
const { TextArea } = Input;

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getAllProjects();
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddEdit = async (values) => {
    setLoading(true);
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, values);
        message.success('Project updated successfully!');
      } else {
        await projectService.createProject(values);
        message.success('Project created successfully!');
      }
      setModalVisible(false);
      form.resetFields();
      await fetchProjects();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Operation failed.';
      message.error(errorMessage);
      console.error("Error saving project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await projectService.deleteProject(id);
      message.success('Project deleted successfully!');
      await fetchProjects();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete project.';
      message.error(errorMessage);
      console.error("Error deleting project:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (project = null) => {
    setEditingProject(project);
    form.setFieldsValue(project || { name: '', description: '' });
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created By',
      dataIndex: 'createdByUsername',
      key: 'createdByUsername',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>Edit</Button>
          {user.role === 'ADMIN' && ( // Only Admin can delete projects
            <Popconfirm
              title="Are you sure to delete this project?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading && !projects.length) {
    return <Spin size="large" style={{ display: 'block', margin: 'auto', marginTop: '100px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Project Management</Title>
      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 20 }} />}
      <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ marginBottom: 16 }}>
        Add Project
      </Button>

      <Table dataSource={projects} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingProject ? 'Edit Project' : 'Add New Project'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEdit}>
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please input the project name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingProject ? 'Update Project' : 'Create Project'}
            </Button>
            <Button onClick={() => {
              setModalVisible(false);
              form.resetFields();
            }} style={{ marginLeft: 8 }}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;