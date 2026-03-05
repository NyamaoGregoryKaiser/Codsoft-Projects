import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  SearchOutlined,
  LineChartOutlined,
  TableOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

const { Header, Sider, Content } = Layout;

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleMenuClick = (e) => {
    navigate(`/${e.key}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: 'connections', icon: <DatabaseOutlined />, label: 'Connections' },
      { key: 'optimizer', icon: <SearchOutlined />, label: 'Query Optimizer' },
      { key: 'metrics', icon: <LineChartOutlined />, label: 'Metrics Monitor' },
      { key: 'schema', icon: <TableOutlined />, label: 'Schema Viewer' },
    ];
    if (user?.role === 'admin') {
      items.push({ key: 'users', icon: <UserOutlined />, label: 'User Management' });
    }
    return items;
  };

  const userMenuItems = [
    { key: 'profile', label: (<span><UserOutlined /> Profile</span>) },
    { key: 'settings', label: (<span><SettingOutlined /> Settings</span>) },
    { type: 'divider' },
    { key: 'logout', label: (<span onClick={handleLogout}><LogoutOutlined /> Logout</span>) },
  ];

  const getDefaultSelectedKeys = () => {
    // Determine selected key based on current path
    const path = location.pathname.split('/')[1] || 'dashboard';
    return [path];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <Logo collapsed={collapsed} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={getDefaultSelectedKeys()}
          selectedKeys={getDefaultSelectedKeys()}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} style={{ marginRight: 24 }}>
              <Space>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.username || 'Guest'}</span>
              </Space>
            </a>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;