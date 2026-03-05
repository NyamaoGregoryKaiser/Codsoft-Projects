import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Select, Spin, Alert, Card, Typography, Collapse, Tag, Space, notification, Divider
} from 'antd';
import { RocketOutlined, HistoryOutlined, CodeOutlined, BulbOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getConnections } from '../api/connections';
import { analyzeQuery, getAnalysisHistory, getAnalysisDetails, updateSuggestionStatus } from '../api/queryAnalysis';

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const statusColors = {
  pending: 'blue',
  applied: 'green',
  dismissed: 'red',
};

function QueryOptimizerPage() {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [queryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchAnalysisHistory(selectedConnection);
    } else {
      setAnalysisHistory([]);
      setAnalysisResult(null);
    }
  }, [selectedConnection]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await getConnections();
      setConnections(data);
      if (data.length > 0) {
        setSelectedConnection(data[0].id); // Select first connection by default
      }
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch connections.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisHistory = async (connId) => {
    setLoading(true);
    try {
      const history = await getAnalysisHistory(connId);
      setAnalysisHistory(history);
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch analysis history.' });
    } finally {
      setLoading(false);
    }
  };

  const onAnalyze = async (values) => {
    setLoading(true);
    setAnalysisResult(null);
    setSelectedAnalysisId(null);
    try {
      const result = await analyzeQuery(values.connectionId, values.query);
      setAnalysisResult(result);
      fetchAnalysisHistory(values.connectionId); // Refresh history
      notification.success({ message: 'Analysis Complete', description: 'Query analyzed successfully!' });
    } catch (error) {
      notification.error({
        message: 'Analysis Failed',
        description: error.response?.data?.message || 'Failed to analyze query.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistoryDetail = async (analysisId) => {
    setLoading(true);
    setAnalysisResult(null); // Clear current analysis
    setSelectedAnalysisId(analysisId);
    try {
      const details = await getAnalysisDetails(analysisId);
      setAnalysisResult({
        query: details.query_text,
        totalTime: details.total_time_ms,
        planningTime: details.planning_time_ms,
        planJson: details.plan_json,
        suggestions: details.suggestions,
      });
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch analysis details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuggestionStatus = async (suggestionId, status) => {
    setLoading(true);
    try {
      await updateSuggestionStatus(suggestionId, status);
      notification.success({ message: 'Success', description: 'Suggestion status updated.' });
      if (selectedAnalysisId) {
        handleViewHistoryDetail(selectedAnalysisId); // Refresh details if viewing history
      } else if (analysisResult?.analysisId) {
        // This is tricky: if it's the current session's analysis, its ID is in analysisResult
        handleViewHistoryDetail(analysisResult.analysisId);
      }
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to update suggestion status.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Query Optimizer</Title>
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={queryForm}
          layout="vertical"
          onFinish={onAnalyze}
          initialValues={{ connectionId: selectedConnection }}
        >
          <Form.Item label="Select Database Connection" name="connectionId" rules={[{ required: true, message: 'Please select a connection' }]}>
            <Select
              placeholder="Select a connection"
              onChange={(value) => setSelectedConnection(value)}
              value={selectedConnection}
              loading={loading && connections.length === 0}
            >
              {connections.map((conn) => (
                <Option key={conn.id} value={conn.id}>{conn.name} ({conn.database})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="SQL Query" name="query" rules={[{ required: true, message: 'Please enter a SQL query' }]}>
            <TextArea rows={8} placeholder="Enter your SQL query here (e.g., SELECT * FROM users WHERE id = 1;)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<RocketOutlined />} loading={loading}>
              Analyze Query
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={24}>
        <Col span={8}>
          <Card title={<Space><HistoryOutlined /> Analysis History</Space>} loading={loading}>
            {analysisHistory.length === 0 ? (
              <Alert message="No analysis history for this connection." type="info" />
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {analysisHistory.map((historyItem) => (
                  <li key={historyItem.id} style={{ marginBottom: 8, padding: 8, border: selectedAnalysisId === historyItem.id ? '1px solid #1890ff' : '1px solid #eee', borderRadius: 4, cursor: 'pointer', backgroundColor: selectedAnalysisId === historyItem.id ? '#e6f7ff' : '#fff' }} onClick={() => handleViewHistoryDetail(historyItem.id)}>
                    <Text strong>{historyItem.query_text.substring(0, 50)}...</Text><br />
                    <Text type="secondary" style={{ fontSize: '0.8em' }}>
                      {new Date(historyItem.created_at).toLocaleString()} | Time: {historyItem.total_time_ms?.toFixed(2) || 'N/A'}ms
                    </Text>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
        <Col span={16}>
          {analysisResult && (
            <Card title={<Space><CodeOutlined /> Analysis Results</Space>} loading={loading}>
              <Title level={4}>Original Query</Title>
              <Input.TextArea value={analysisResult.query} autoSize readOnly style={{ marginBottom: 16 }} />

              <Title level={4}>Performance Summary</Title>
              <p>Total Execution Time: <Text strong>{analysisResult.totalTime?.toFixed(2) || 'N/A'} ms</Text></p>
              <p>Planning Time: <Text strong>{analysisResult.planningTime?.toFixed(2) || 'N/A'} ms</Text></p>

              <Divider />

              <Title level={4}>Optimization Suggestions <BulbOutlined /></Title>
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 ? (
                <Collapse accordion>
                  {analysisResult.suggestions.map((sug, index) => (
                    <Panel
                      header={
                        <Space>
                          <Tag color={statusColors[sug.status || 'pending']}>{sug.status?.toUpperCase() || 'PENDING'}</Tag>
                          <Text strong>{sug.message.split('.')[0]}.</Text>
                          <Tag color={sug.level === 'CRITICAL' ? 'red' : sug.level === 'WARNING' ? 'orange' : 'blue'}>
                            {sug.level}
                          </Tag>
                        </Space>
                      }
                      key={index}
                    >
                      <Text>{sug.message}</Text>
                      <pre style={{ backgroundColor: '#f0f2f5', padding: 10, borderRadius: 4, marginTop: 10, overflowX: 'auto' }}>
                        <code>{JSON.stringify(sug.details, null, 2)}</code>
                      </pre>
                      <Space style={{ marginTop: 10 }}>
                        {sug.status !== 'applied' && (
                          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateSuggestionStatus(sug.id, 'applied')}>
                            Mark as Applied
                          </Button>
                        )}
                        {sug.status !== 'dismissed' && (
                          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateSuggestionStatus(sug.id, 'dismissed')} danger>
                            Dismiss
                          </Button>
                        )}
                      </Space>
                    </Panel>
                  ))}
                </Collapse>
              ) : (
                <Alert message="No specific optimization suggestions found." type="success" />
              )}

              <Divider />

              <Title level={4}>Query Plan (JSON)</Title>
              <Input.TextArea
                value={JSON.stringify(analysisResult.planJson, null, 2)}
                autoSize={{ minRows: 10, maxRows: 30 }}
                readOnly
              />
            </Card>
          )}
          {!analysisResult && !loading && (
            <Alert message="Submit a query to see analysis results here, or select an item from history." type="info" showIcon />
          )}
        </Col>
      </Row>
    </div>
  );
}

export default QueryOptimizerPage;