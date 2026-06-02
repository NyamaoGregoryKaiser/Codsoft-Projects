import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography, Alert } from 'antd';
import { ProjectOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import * as projectService from '../services/project';
import * as taskService from '../services/task';
import * as userService from '../services/user';
import { useAuth } from '../hooks/useAuth';

const { Title, Paragraph } = Typography;

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectsRes, tasksRes, usersRes] = await Promise.all([
          projectService.getAllProjects(),
          taskService.getAllTasks(),
          user.role === 'ADMIN' ? userService.getAllUsers() : Promise.resolve({ data: [] }), // Only fetch users if admin
        ]);

        const projects = projectsRes.data;
        const tasks = tasksRes.data;
        const users = usersRes.data;

        const completedTasks = tasks.filter(task => task.status === 'DONE').length;

        setDashboardData({
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedTasks: completedTasks,
          totalUsers: user.role === 'ADMIN' ? users.length : 0,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: 'auto', marginTop: '100px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard</Title>
      <Paragraph>Welcome back, {user?.username}! Here's a quick overview of your ETMS.</Paragraph>

      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 20 }} />}

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={dashboardData.totalProjects}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Tasks"
              value={dashboardData.totalTasks}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Tasks"
              value={dashboardData.completedTasks}
              prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
            />
          </Card>
        </Col>
        {user.role === 'ADMIN' && (
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={dashboardData.totalUsers}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Future sections: Recent Projects, My Tasks, etc. */}
    </div>
  );
};

export default DashboardPage;