import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      ETMS ©{new Date().getFullYear()} Created by Your Company
    </Footer>
  );
};

export default AppFooter;