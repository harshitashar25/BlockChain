import React, { useState } from 'react';
import { Input, Button, Card, Descriptions, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function EvidenceViewer() {
  const [caseId, setCaseId] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [signatureValid, setSignatureValid] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCase = async () => {
    if (!caseId) {
      message.warning('Please enter a Case ID');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/fabric/case/${caseId}`);
      setCaseData(response.data.case);
      
      // In production, would verify signature here
      // For PoC, simulate verification
      setSignatureValid(true);
    } catch (error) {
      message.error('Case not found: ' + error.message);
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Evidence Viewer</h2>
      <Card style={{ marginBottom: '16px' }}>
        <Input.Group compact>
          <Input
            style={{ width: 'calc(100% - 100px)' }}
            placeholder="Enter Case ID"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            onPressEnter={fetchCase}
          />
          <Button type="primary" onClick={fetchCase} loading={loading}>
            View Evidence
          </Button>
        </Input.Group>
      </Card>

      {caseData && (
        <Card>
          <Descriptions title="Case Information" bordered column={1}>
            <Descriptions.Item label="Case ID">{caseData.case_id}</Descriptions.Item>
            <Descriptions.Item label="Evidence Hash">
              <code>{caseData.evidence_hash}</code>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={caseData.freeze_active ? 'green' : 'orange'}>
                {caseData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Requester">{caseData.requester}</Descriptions.Item>
            <Descriptions.Item label="Created At">{caseData.created_at}</Descriptions.Item>
            <Descriptions.Item label="Signature Verification">
              {signatureValid ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Valid
                </Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">
                  Invalid
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Approvals">
              {caseData.approvals.length > 0 ? (
                <div>
                  {caseData.approvals.map((approver, idx) => (
                    <Tag key={idx} color="blue">{approver}</Tag>
                  ))}
                </div>
              ) : (
                'None'
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
}

export default EvidenceViewer;

