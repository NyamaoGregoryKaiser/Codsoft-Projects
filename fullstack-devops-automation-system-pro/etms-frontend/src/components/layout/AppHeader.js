import React from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Header } = Layout;

const AppHeader = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Header>
      <div className="logo" />
      <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
        <Menu.Item key="home">
          <Link to="/">Home</Link>
        </Menu.Item>
        {isAuthenticated && (
          <>
            <Menu.Item key="dashboard">
              <Link to="/dashboard">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="projects">
              <Link to="/projects">Projects</Link>
            </Menu.Item>
            <Menu.Item key="tasks">
              <Link to="/tasks">Tasks</Link>
            </Menu.Item>
            {/* {user?.role === 'ADMIN' && (
              <Menu.Item key="users">
                <Link to="/users">Users</Link>
              </Menu.Item>
            )} */}
          </>
        )}
      </Menu>
      <Space>
        {isAuthenticated ? (
          <>
            <span style={{ color: '#fff', marginRight: '10px' }}>
              Welcome, {user?.username} ({user?.role})
            </span>
            <Button type="primary" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button type="primary">
              <Link to="/login">Login</Link>
            </Button>
            <Button type="default">
              <Link to="/register">Register</Link>
            </Button>
          </>
        )}
      </Space>
    </Header>
  );
};

export default AppHeader;