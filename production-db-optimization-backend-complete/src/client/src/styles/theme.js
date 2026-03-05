const theme = {
  token: {
    colorPrimary: '#0050b3', // A shade of blue for primary actions
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorTextBase: '#262626',
    colorBgLayout: '#f0f2f5', // Background for layout
    borderRadius: 6,
  },
  components: {
    Layout: {
      headerBg: '#fff',
      siderBg: '#001529', // Dark blue for sidebar
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#0050b3', // Primary blue for selected menu item
      darkSubMenuItemBg: '#000c17',
    },
    Button: {
      colorPrimary: '#0050b3',
    },
    Card: {
      headerBg: '#f7f9fc',
      actionsBg: '#fff',
    },
    Table: {
      headerBg: '#f7f9fc',
    }
  },
};

export default theme;