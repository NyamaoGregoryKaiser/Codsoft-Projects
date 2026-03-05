import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Spin, Alert, Card, Typography, Collapse, Table, Tag, Space, notification } from 'antd';
import { DatabaseOutlined, TableOutlined, ColumnWidthOutlined, KeyOutlined } from '@ant-design/icons';
import { getConnections } from '../api/connections';
import { getTables, getTableDetails } from '../api/schema';
import { useParams } from 'react-router-dom';

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

function SchemaViewerPage() {
  const { connectionId: urlConnectionId } = useParams();
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(urlConnectionId || null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTableDetails, setSelectedTableDetails] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchTables(selectedConnection);
      setSelectedTableDetails(null); // Clear details when connection changes
    } else {
      setTables([]);
    }
  }, [selectedConnection]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await getConnections();
      setConnections(data);
      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0].id);
      }
    } catch (err) {
      setError('Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (connId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTables(connId);
      setTables(data);
    } catch (err) {
      setError(`Failed to load tables: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (schemaName, tableName) => {
    setLoading(true);
    setError(null);
    try {
      const details = await getTableDetails(selectedConnection, schemaName, tableName);
      setSelectedTableDetails(details);
    } catch (err) {
      setError(`Failed to load table details: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columnsColumns = [
    { title: 'Column Name', dataIndex: 'column_name', key: 'column_name' },
    { title: 'Data Type', dataIndex: 'data_type', key: 'data_type' },
    { title: 'Nullable', dataIndex: 'is_nullable', key: 'is_nullable', render: (text) => <Tag color={text === 'YES' ? 'red' : 'green'}>{text}</Tag> },
    { title: 'Default', dataIndex: 'column_default', key: 'column_default', render: (text) => text || '-' },
  ];

  const indexesColumns = [
    { title: 'Index Name', dataIndex: 'indexname', key: 'indexname' },
    { title: 'Definition', dataIndex: 'indexdef', key: 'indexdef' },
  ];

  const constraintsColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Definition', dataIndex: 'definition', key: 'definition' },
  ];

  if (loading && connections.length === 0) return <Spin tip="Loading connections..." size="large" />;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;
  if (connections.length === 0) return <Alert message="No connections found. Please add a database connection to view schemas." type="info" showIcon />;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Schema Viewer</Title>
        </Col>
        <Col>
          <Select
            placeholder="Select Connection"
            style={{ width: 200 }}
            onChange={setSelectedConnection}
            value={selectedConnection}
          >
            {connections.map((conn) => (
              <Option key={conn.id} value={conn.id}>
                {conn.name} ({conn.database})
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {!selectedConnection ? (
        <Alert message="Please select a database connection to view its schema." type="info" showIcon />
      ) : (
        <Spin spinning={loading}>
          <Row gutter={24}>
            <Col span={8}>
              <Card title={<Space><TableOutlined /> Tables</Space>} loading={loading}>
                {tables.length === 0 ? (
                  <Alert message="No tables found in this database." type="info" />
                ) : (
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {tables.map((table) => (
                      <li
                        key={`${table.schemaname}.${table.tablename}`}
                        style={{
                          marginBottom: 8,
                          padding: 8,
                          border: selectedTableDetails?.tableName === table.tablename && selectedTableDetails?.schemaName === table.schemaname
                            ? '1px solid #1890ff' : '1px solid #eee',
                          borderRadius: 4,
                          cursor: 'pointer',
                          backgroundColor: selectedTableDetails?.tableName === table.tablename && selectedTableDetails?.schemaName === table.schemaname
                            ? '#e6f7ff' : '#fff'
                        }}
                        onClick={() => handleTableSelect(table.schemaname, table.tablename)}
                      >
                        <Text strong>{table.schemaname}.{table.tablename}</Text>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Col>
            <Col span={16}>
              {selectedTableDetails ? (
                <Card title={<Space><DatabaseOutlined /> Details for {selectedTableDetails.schemaName}.{selectedTableDetails.tableName}</Space>} loading={loading}>
                  <Collapse defaultActiveKey={['1', '2', '3']} expandIconPosition="right">
                    <Panel header={<Space><ColumnWidthOutlined /> Columns</Space>} key="1">
                      <Table dataSource={selectedTableDetails.columns} columns={columnsColumns} rowKey="column_name" pagination={false} />
                    </Panel>
                    <Panel header={<Space><KeyOutlined /> Indexes</Space>} key="2">
                      <Table dataSource={selectedTableDetails.indexes} columns={indexesColumns} rowKey="indexname" pagination={false} />
                    </Panel>
                    <Panel header={<Space><KeyOutlined /> Constraints</Space>} key="3">
                      <Table dataSource={selectedTableDetails.constraints} columns={constraintsColumns} rowKey="name" pagination={false} />
                    </Panel>
                  </Collapse>
                </Card>
              ) : (
                <Alert message="Select a table from the left to view its details." type="info" showIcon />
              )}
            </Col>
          </Row>
        </Spin>
      )}
    </div>
  );
}

export default SchemaViewerPage;