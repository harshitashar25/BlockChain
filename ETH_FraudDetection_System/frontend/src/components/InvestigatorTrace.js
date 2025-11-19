import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Form, Select, message } from 'antd';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function InvestigatorTrace() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const graphRef = useRef();

  const onTrace = async (values) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/tracer/trace`, {
        params: {
          seed: values.seed,
          depth: values.depth || 6,
          hours: values.hours || 48,
          minAmt: values.minAmt || 100
        }
      });

      const result = response.data.result;
      
      // Convert to graph format
      const nodes = result.nodes.map(node => ({
        id: node.id,
        label: node.id,
        type: node.type,
        group: node.type === 'exchange' ? 1 : node.type === 'bank' ? 2 : 3
      }));

      const links = result.edges.map(edge => ({
        source: edge.from,
        target: edge.to
      }));

      setGraphData({ nodes, links });
      message.success(`Found ${result.total_paths} paths to exchange endpoints`);
    } catch (error) {
      message.error('Failed to trace: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Investigator Trace - Path Finding</h2>
      <Card style={{ marginBottom: '16px' }}>
        <Form form={form} layout="inline" onFinish={onTrace}>
          <Form.Item
            name="seed"
            rules={[{ required: true, message: 'Enter seed actor ID' }]}
          >
            <Input placeholder="chain:0x742d35..." style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="depth" initialValue={6}>
            <Select style={{ width: 100 }}>
              <Select.Option value={4}>Depth 4</Select.Option>
              <Select.Option value={6}>Depth 6</Select.Option>
              <Select.Option value={8}>Depth 8</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="hours" initialValue={48}>
            <Select style={{ width: 120 }}>
              <Select.Option value={24}>24 hours</Select.Option>
              <Select.Option value={48}>48 hours</Select.Option>
              <Select.Option value={72}>72 hours</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Trace
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ height: '600px', border: '1px solid #d9d9d9' }}>
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel="label"
            nodeColor={(node) => {
              if (node.type === 'exchange') return '#ff4d4f';
              if (node.type === 'bank') return '#1890ff';
              return '#52c41a';
            }}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.id.split(':')[1]?.slice(0, 10) || node.id;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#000';
              ctx.fillText(label, node.x, node.y + 8);
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default InvestigatorTrace;

