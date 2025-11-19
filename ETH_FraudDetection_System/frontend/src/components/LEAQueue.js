import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Descriptions, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function LEAQueue() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/fabric/cases`);
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleApprove = async (caseId) => {
    try {
      await axios.post(`${API_BASE}/api/fabric/approve-freeze`, {
        caseId: caseId,
        approver: 'lea-approver-001'
      });
      message.success('Freeze approved');
      fetchCases();
    } catch (error) {
      message.error('Failed to approve freeze: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'Case ID',
      dataIndex: 'case_id',
      key: 'case_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          'SUBMITTED': 'blue',
          'FREEZE_REQUESTED': 'orange',
          'FREEZE_ACTIVE': 'green'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Approvals',
      dataIndex: 'approvals',
      key: 'approvals',
      render: (approvals) => `${approvals.length}/2`
    },
    {
      title: 'Freeze Active',
      dataIndex: 'freeze_active',
      key: 'freeze_active',
      render: (active) => active ? <Tag color="green">YES</Tag> : <Tag>NO</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div>
          <Button
            type="link"
            onClick={() => {
              setSelectedCase(record);
              setModalVisible(true);
            }}
          >
            View Details
          </Button>
          {record.status === 'FREEZE_REQUESTED' && !record.freeze_active && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.case_id)}
            >
              Approve Freeze
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <h2>LEA Queue - Freeze Approvals</h2>
      <Table
        dataSource={cases}
        columns={columns}
        rowKey="case_id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Case Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCase && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Case ID">{selectedCase.case_id}</Descriptions.Item>
            <Descriptions.Item label="Status">{selectedCase.status}</Descriptions.Item>
            <Descriptions.Item label="Evidence Hash">{selectedCase.evidence_hash}</Descriptions.Item>
            <Descriptions.Item label="Requester">{selectedCase.requester}</Descriptions.Item>
            <Descriptions.Item label="Created At">{selectedCase.created_at}</Descriptions.Item>
            <Descriptions.Item label="Approvals">
              {selectedCase.approvals.join(', ') || 'None'}
            </Descriptions.Item>
            <Descriptions.Item label="Asset References">
              {selectedCase.asset_refs.join(', ') || 'None'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default LEAQueue;

