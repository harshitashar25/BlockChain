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
      // Step 1: Submit case
      const response = await axios.post(`${API_BASE}/api/fabric/submit-evidence`, {
        caseId: values.caseId,
        evidenceHash: `hash-${Date.now()}`, // In production: actual SHA-256 hash
        requester: 'bank-user-001'
      });

      message.success(`Case ${values.caseId} submitted successfully`);

      // Step 2: If UTR provided, automatically run trace to get asset references
      if (values.utr) {
        message.info('Running automated trace to get asset references...');
        try {
          const traceResponse = await axios.post(`${API_BASE}/api/automated-trace/utr-with-assets`, {
            utr: values.utr,
            chain: 'eth',
            depth: 6,
            hours: 168
          });

          if (traceResponse.data.asset_refs && traceResponse.data.asset_refs.length > 0) {
            // Step 3: Update case with asset references
            await axios.post(`${API_BASE}/api/freeze/request`, {
              caseId: values.caseId,
              evidenceHash: `hash-${Date.now()}`,
              requestedBy: 'bank-user-001',
              severity: 'high',
              assetRefs: traceResponse.data.asset_refs
            });

            message.success(`✅ Trace completed! Found ${traceResponse.data.asset_refs.length} asset references. Case ready for freeze.`);
          } else {
            message.warning('Trace completed but no asset references found. You can add them manually later.');
          }
        } catch (traceError) {
          message.warning('Could not run automated trace. You can run it manually from LEA Dashboard.');
          console.error('Trace error:', traceError);
        }
      }

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

