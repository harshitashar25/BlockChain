import React, { useState, useEffect } from 'react';
import { Card, Statistic, List, Tag, Button } from 'antd';
import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeFreezes: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/fabric/cases`);
      const cases = response.data.cases || [];
      setAlerts(cases.filter(c => c.status === 'SUBMITTED' || c.status === 'FREEZE_REQUESTED'));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/fabric/cases`);
      const cases = response.data.cases || [];
      setStats({
        totalCases: cases.length,
        activeFreezes: cases.filter(c => c.freeze_active).length,
        pendingApprovals: cases.filter(c => c.status === 'FREEZE_REQUESTED').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <Statistic
            title="Total Cases"
            value={stats.totalCases}
            prefix={<AlertOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Active Freezes"
            value={stats.activeFreezes}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Pending Approvals"
            value={stats.pendingApprovals}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </div>

      <Card title="Recent Alerts">
        <List
          dataSource={alerts}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.case_id}
                description={`Status: ${item.status} | Evidence Hash: ${item.evidence_hash.slice(0, 16)}...`}
              />
              <Tag color={item.status === 'SUBMITTED' ? 'blue' : 'orange'}>
                {item.status}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default Dashboard;

