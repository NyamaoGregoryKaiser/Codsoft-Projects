import React from 'react';
import { Typography, Space, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Title>Welcome to ETMS</Title>
      <Paragraph>
        Your Enterprise Task Management System to streamline project and task workflows.
      </Paragraph>
      {isAuthenticated ? (
        <Space direction="vertical" size="large">
          <Paragraph>Hello, {user?.username}! You are logged in as {user?.role}.</Paragraph>
          <Button type="primary" size="large">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </Space>
      ) : (
        <Space size="large">
          <Button type="primary" size="large">
            <Link to="/login">Login</Link>
          </Button>
          <Button size="large">
            <Link to="/register">Register</Link>
          </Button>
        </Space>
      )}
    </div>
  );
};

export default HomePage;