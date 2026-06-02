import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography, Select, DatePicker, Popconfirm, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as taskService from '../services/task';
import * as projectService from '../services/project';
import * as userService from '../services/user';
import { useAuth } from '../hooks/useAuth';
import moment from 'moment';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskStatusOptions = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CLOSED'];
const TaskPriorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  const fetchTasksAndDependencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        taskService.getAllTasks(),
        projectService.getAllProjects(),
        userService.getAllUsers(), // Admin can see all users, regular users might only see assigned_to options
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch tasks or dependencies:", err);
      setError("Failed to load tasks data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndDependencies();
  }, []);

  const handleAddEdit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null, // Convert Moment object to ISO string
      };

      if (editingTask) {
        await taskService.updateTask(editingTask.id, payload);
        message.success('Task updated successfully!');
      } else {
        await taskService.createTask(payload);
        message.success('Task created successfully!');
      }
      setModalVisible(false);
      form.resetFields();
      await fetchTasksAndDependencies();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Operation failed.';
      message.error(errorMessage);
      console.error("Error saving task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await taskService.deleteTask(id);
      message.success('Task deleted successfully!');
      await fetchTasksAndDependencies();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete task.';
      message.error(errorMessage);
      console.error("Error deleting task:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      form.setFieldsValue({
        ...task,
        dueDate: task.dueDate ? moment(task.dueDate) : null, // Convert ISO string to Moment object
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Project',
      dataIndex: 'projectId',
      key: 'projectId',
      render: (projectId) => projects.find(p => p.id === projectId)?.name || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedToUsername',
      key: 'assignedToUsername',
      render: (username) => username || 'Unassigned',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm') : 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>Edit</Button>
          {user.role === 'ADMIN' && ( // Only Admin can delete tasks
            <Popconfirm
              title="Are you sure to delete this task?"
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

  if (loading && !tasks.length) {
    return <Spin size="large" style={{ display: 'block', margin: 'auto', marginTop: '100px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Task Management</Title>
      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 20 }} />}
      <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ marginBottom: 16 }}>
        Add Task
      </Button>

      <Table dataSource={tasks} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEdit}>
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please input the task title!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select a status!' }]}
              >
                <Select placeholder="Select status">
                  {TaskStatusOptions.map(status => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select a priority!' }]}
              >
                <Select placeholder="Select priority">
                  {TaskPriorityOptions.map(priority => (
                    <Option key={priority} value={priority}>{priority}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="projectId"
            label="Project"
            rules={[{ required: true, message: 'Please select a project!' }]}
          >
            <Select placeholder="Select project">
              {projects.map(project => (
                <Option key={project.id} value={project.id}>{project.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="assignedToId"
            label="Assigned To"
          >
            <Select placeholder="Select user (optional)" allowClear>
              {users.map(u => (
                <Option key={u.id} value={u.id}>{u.username}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="Due Date"
          >
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingTask ? 'Update Task' : 'Create Task'}
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

export default TasksPage;