import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function BankReport() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // In production, would upload evidence file to MinIO and get URL
      // For PoC, just submit the case
      const response = await axios.post(`${API_BASE}/api/fabric/submit-evidence`, {
        caseId: values.caseId,
        evidenceHash: `hash-${Date.now()}`, // In production: actual SHA-256 hash
        requester: 'bank-user-001'
      });

      message.success(`Case ${values.caseId} submitted successfully`);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit case: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Bank Report - Submit Fraud Case</h2>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Case ID"
            name="caseId"
            rules={[{ required: true, message: 'Please enter Case ID' }]}
          >
            <Input placeholder="CASE-001" />
          </Form.Item>

          <Form.Item
            label="UTR"
            name="utr"
            rules={[{ required: true, message: 'Please enter UTR' }]}
          >
            <Input placeholder="UTR123456789" />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <Input type="number" placeholder="100000" />
          </Form.Item>

          <Form.Item
            label="Evidence File"
            name="evidenceFile"
          >
            <Upload beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Fraud Report
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default BankReport;

