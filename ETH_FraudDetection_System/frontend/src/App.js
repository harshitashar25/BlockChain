import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import Dashboard from './components/Dashboard';
import BankReport from './components/BankReport';
import LEAQueue from './components/LEAQueue';
import InvestigatorTrace from './components/InvestigatorTrace';
import EvidenceViewer from './components/EvidenceViewer';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [selectedView, setSelectedView] = useState('dashboard');

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'bank-report', label: 'Bank Report' },
    { key: 'lea-queue', label: 'LEA Queue' },
    { key: 'investigator-trace', label: 'Investigator Trace' },
    { key: 'evidence-viewer', label: 'Evidence Viewer' }
  ];

  const renderContent = () => {
    switch (selectedView) {
      case 'dashboard':
        return <Dashboard />;
      case 'bank-report':
        return <BankReport />;
      case 'lea-queue':
        return <LEAQueue />;
      case 'investigator-trace':
        return <InvestigatorTrace />;
      case 'evidence-viewer':
        return <EvidenceViewer />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', color: '#fff', padding: '0 24px' }}>
        <h1 style={{ color: '#fff', margin: 0, lineHeight: '64px' }}>
          Fraud Trail System - Investigator UI
        </h1>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedView]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => setSelectedView(key)}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
