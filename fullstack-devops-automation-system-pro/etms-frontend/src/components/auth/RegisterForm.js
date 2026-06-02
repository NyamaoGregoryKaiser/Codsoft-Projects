import React from 'react';
import { Form, Input, Button, Typography, Alert, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const RegisterForm = ({ onFinish, error, loading }) => {
  return (
    <div className="register-form">
      <Title level={3} style={{ textAlign: 'center' }}>Register</Title>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}
      <Form
        name="register"
        onFinish={onFinish}
        scrollToFirstError
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: 'Please input your Username!' },
            { min: 3, message: 'Username must be at least 3 characters long!' },
            { max: 50, message: 'Username cannot exceed 50 characters!' },
          ]}
          hasFeedback
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { type: 'email', message: 'The input is not valid E-mail!' },
            { required: true, message: 'Please input your E-mail!' },
          ]}
          hasFeedback
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters long!' },
          ]}
          hasFeedback
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords that you entered do not match!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          initialValue="USER"
          rules={[{ required: true, message: 'Please select a role!' }]}
        >
          <Select placeholder="Select a role">
            <Option value="USER">User</Option>
            {/* In a real application, ADMIN role should not be selectable via public registration */}
            {/* <Option value="ADMIN">Admin</Option> */}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            Register
          </Button>
          Already have an account? <Link to="/login">Login now!</Link>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;