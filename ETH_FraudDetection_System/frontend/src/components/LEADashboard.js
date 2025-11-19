import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Descriptions, message, Input, Select, Space, Typography, Alert, Steps, Progress, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, StopOutlined, WarningOutlined, SearchOutlined, FileTextOutlined, ExportOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function LEADashboard() {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterCases();
  }, [cases, searchText, statusFilter, severityFilter]);

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/freeze/cases`);
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      // Fallback to fabric cases if freeze API not available
      try {
        const fallback = await axios.get(`${API_BASE}/api/fabric/cases`);
        setCases(fallback.data.cases || []);
      } catch (e) {
        message.error('Failed to fetch cases');
      }
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(c => 
        c.case_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.utr?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.victim_account?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        if (statusFilter === 'PENDING') return c.status === 'PENDING_APPROVAL' || c.status === 'FREEZE_REQUESTED';
        if (statusFilter === 'APPROVED') return c.status === 'FREEZE_ACTIVE';
        if (statusFilter === 'FROZEN') return c.freeze_active === true;
        return true;
      });
    }

    // Severity filter
    if (severityFilter !== 'ALL') {
      filtered = filtered.filter(c => c.severity === severityFilter);
    }

    setFilteredCases(filtered);
  };

  const handleRequestFreeze = async (caseId, assetRefs) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/freeze/request`, {
        caseId: caseId,
        assetRefs: assetRefs || [],
        requestedBy: 'LEA:IndiaCyber'
      });
      message.success('Freeze requested successfully');
      setFreezeModalVisible(false);
      fetchCases();
    } catch (error) {
      message.error('Failed to request freeze: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFreeze = async (caseId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/freeze/approve`, {
        caseId: caseId,
        approver: `LEA:IndiaCyber-${Date.now()}`
      });
      
      if (response.data.freeze_activated) {
        message.success('✅ Freeze activated! Bank holds are being placed automatically.');
      } else {
        const remaining = response.data.requiredApprovals - response.data.currentApprovals;
        message.success(`✅ Approval recorded. Need ${remaining} more approval(s).`);
      }
      fetchCases();
    } catch (error) {
      message.error('Failed to approve freeze: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (caseId) => {
    Modal.confirm({
      title: 'Reject Freeze Request',
      content: 'Are you sure you want to reject this freeze request?',
      onOk: async () => {
        try {
          await axios.post(`${API_BASE}/api/freeze/reject`, { caseId });
          message.success('Freeze request rejected');
          fetchCases();
        } catch (error) {
          message.error('Failed to reject: ' + error.message);
        }
      }
    });
  };

  const handleRunTrace = async (caseId, utr) => {
    setLoading(true);
    try {
      message.info('Running automated trace... This may take a minute.');
      
      // Run automated trace
      const traceResponse = await axios.post(`${API_BASE}/api/automated-trace/utr-with-assets`, {
        utr: utr,
        chain: 'eth',
        depth: 6,
        hours: 168
      });

      if (traceResponse.data.asset_refs && traceResponse.data.asset_refs.length > 0) {
        // Get case to get evidence hash
        const caseResponse = await axios.get(`${API_BASE}/api/fabric/case/${caseId}`);
        const caseObj = caseResponse.data.case;
        
        if (!caseObj) {
          throw new Error('Case not found');
        }

        // Request freeze with asset references
        await axios.post(`${API_BASE}/api/freeze/request`, {
          caseId: caseId,
          evidenceHash: caseObj.evidence_hash,
          requestedBy: 'LEA:IndiaCyber',
          severity: 'high',
          assetRefs: traceResponse.data.asset_refs
        });

        message.success(`✅ Trace completed! Found ${traceResponse.data.asset_refs.length} asset references. Freeze requested.`);
        fetchCases();
      } else {
        message.warning('Trace completed but no asset references found.');
      }
    } catch (error) {
      message.error('Failed to run trace: ' + error.message);
      console.error('Trace error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'SUBMITTED': 'blue',
      'PENDING_APPROVAL': 'orange',
      'FREEZE_REQUESTED': 'orange',
      'FREEZE_ACTIVE': 'green',
      'FROZEN': 'red',
      'RESOLVED': 'default'
    };
    return colorMap[status] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colorMap = {
      'high': 'red',
      'medium': 'orange',
      'low': 'blue'
    };
    return colorMap[severity?.toLowerCase()] || 'default';
  };

  const getApprovalProgress = (caseItem) => {
    const approvals = caseItem.approvals || [];
    const required = caseItem.requiredApprovals || 3;
    const progress = (approvals.length / required) * 100;
    return { progress, remaining: required - approvals.length, required };
  };

  const columns = [
    {
      title: 'Case ID',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity?.toUpperCase() || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Victim Account',
      dataIndex: 'victim_account',
      key: 'victim_account',
      width: 150,
      render: (text) => text ? <Text code>{text.slice(0, 20)}...</Text> : '-'
    },
    {
      title: 'UTR',
      dataIndex: 'utr',
      key: 'utr',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Approval Progress',
      key: 'approval_progress',
      width: 200,
      render: (_, record) => {
        if (record.status === 'SUBMITTED') {
          return <Text type="secondary">Not requested</Text>;
        }
        const { progress, remaining, required } = getApprovalProgress(record);
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Progress percent={progress} status={remaining === 0 ? 'success' : 'active'} size="small" />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.approvals?.length || 0}/{required} ({remaining} remaining)
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCase(record);
              setModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'SUBMITTED' && (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={() => {
                setSelectedCase(record);
                setFreezeModalVisible(true);
              }}
            >
              Request Freeze
            </Button>
          )}
          {record.status === 'SUBMITTED' && (!record.asset_refs || record.asset_refs.length === 0) && (
            <Button
              type="default"
              icon={<SearchOutlined />}
              onClick={async () => {
                // Prompt for UTR
                Modal.confirm({
                  title: 'Run Automated Trace',
                  content: (
                    <Input
                      placeholder="Enter UTR number"
                      id="utr-input"
                      onPressEnter={(e) => {
                        const utr = e.target.value;
                        if (utr) {
                          Modal.destroy();
                          handleRunTrace(record.case_id, utr);
                        }
                      }}
                    />
                  ),
                  onOk: () => {
                    const input = document.getElementById('utr-input');
                    if (input && input.value) {
                      handleRunTrace(record.case_id, input.value);
                    }
                  }
                });
              }}
            >
              Run Trace
            </Button>
          )}
          {(record.status === 'FREEZE_REQUESTED' || record.status === 'PENDING_APPROVAL') && !record.freeze_active && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproveFreeze(record.case_id)}
                loading={loading}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.case_id)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Title level={2}>LEA Dashboard - Freeze Workflow</Title>
        <Alert
          message="Multi-Party Approval Required"
          description="Freeze requests require 3 approvals (Bank A, Bank B, LEA). Once activated, bank holds are placed automatically across all connected institutions."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Search and Filters */}
        <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
          <Input
            placeholder="Search by Case ID, UTR, or Victim Account"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
          />
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="ALL">All Status</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="FROZEN">Frozen</Option>
            </Select>
            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              style={{ width: 150 }}
            >
              <Option value="ALL">All Severity</Option>
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
          </Space>
        </Space>

        <Table
          dataSource={filteredCases}
          columns={columns}
          rowKey="case_id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* Case Details Modal */}
      <Modal
        title="Case Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedCase && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Case ID" span={2}>
                <Text strong>{selectedCase.case_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedCase.status)}>{selectedCase.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Severity">
                <Tag color={getSeverityColor(selectedCase.severity)}>
                  {selectedCase.severity?.toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Victim Account" span={2}>
                <Text code>{selectedCase.victim_account || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="UTR" span={2}>
                {selectedCase.utr || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Evidence Hash" span={2}>
                <Text code copyable>{selectedCase.evidence_hash}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Requester">
                {selectedCase.requester || selectedCase.requestedBy}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {selectedCase.created_at ? new Date(selectedCase.created_at).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Approval Status</Divider>
            {selectedCase.status !== 'SUBMITTED' && (
              <div>
                <Steps
                  current={selectedCase.approvals?.length || 0}
                  items={[
                    { title: 'First Approval', icon: <CheckCircleOutlined /> },
                    { title: 'Second Approval', icon: <CheckCircleOutlined /> },
                    { title: 'Third Approval', icon: <CheckCircleOutlined /> },
                    { title: 'Freeze Activated', icon: <StopOutlined /> }
                  ]}
                  style={{ marginBottom: 16 }}
                />
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Current Approvals">
                    <Space direction="vertical">
                      {selectedCase.approvals && selectedCase.approvals.length > 0 ? (
                        selectedCase.approvals.map((approver, idx) => (
                          <Tag key={idx} color="green" icon={<CheckCircleOutlined />}>
                            {idx + 1}. {approver}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">No approvals yet</Text>
                      )}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Required Approvals">
                    <Text strong>{selectedCase.requiredApprovals || 3}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Remaining">
                    <Text strong type="danger">
                      {selectedCase.requiredApprovals - (selectedCase.approvals?.length || 0)} more required
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            <Divider>Asset References</Divider>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Assets to Freeze">
                <Space direction="vertical">
                  {selectedCase.asset_refs && selectedCase.asset_refs.length > 0 ? (
                    selectedCase.asset_refs.map((ref, idx) => (
                      <Tag key={idx}>{ref}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">No assets specified</Text>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Actions</Divider>
            <Space>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => {
                  message.info('Evidence viewer coming soon');
                }}
              >
                View Evidence
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  window.open(`/investigator-trace?caseId=${selectedCase.case_id}`, '_blank');
                }}
              >
                View Trail
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => {
                  message.info('Export functionality coming soon');
                }}
              >
                Export Evidence Packet
              </Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* Request Freeze Modal */}
      <Modal
        title="Request Freeze"
        visible={freezeModalVisible}
        onCancel={() => setFreezeModalVisible(false)}
        onOk={() => {
          if (selectedCase && selectedCase.asset_refs && selectedCase.asset_refs.length > 0) {
            handleRequestFreeze(selectedCase.case_id, selectedCase.asset_refs);
          } else {
            message.warning('No asset references found for this case');
          }
        }}
        confirmLoading={loading}
        okText="Request Freeze"
      >
        {selectedCase && (
          <div>
            <Alert
              message="Freeze Request"
              description="This will request a freeze for all asset references. The freeze will activate after 3 approvals (Bank A, Bank B, LEA)."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Case ID">{selectedCase.case_id}</Descriptions.Item>
              <Descriptions.Item label="Asset References">
                <Space direction="vertical">
                  {selectedCase.asset_refs && selectedCase.asset_refs.length > 0 ? (
                    selectedCase.asset_refs.map((ref, idx) => (
                      <Tag key={idx}>{ref}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">No assets to freeze</Text>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LEADashboard;

