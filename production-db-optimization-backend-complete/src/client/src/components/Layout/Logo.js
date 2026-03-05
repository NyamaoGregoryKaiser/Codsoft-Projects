import React from 'react';
import { Space } from 'antd';
import { CloudOutlined } from '@ant-design/icons';

function Logo({ collapsed }) {
  return (
    <div style={{
      height: 64,
      margin: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      overflow: 'hidden',
    }}>
      <Space>
        <CloudOutlined style={{ color: '#fff', fontSize: 24 }} />
        {!collapsed && <h1 style={{ color: '#fff', margin: 0, fontSize: 20 }}>DBTune</h1>}
      </Space>
    </div>
  );
}

export default Logo;