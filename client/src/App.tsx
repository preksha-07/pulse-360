import { useEffect, useState } from 'react';
import type { IntelligencePayload } from './types';
import Dashboard from './components/Dashboard';
import FanPortal from './components/FanPortal';
import VolunteerPortal from './components/VolunteerPortal';
import SecurityPortal from './components/SecurityPortal';

type Tab = 'command' | 'fan' | 'volunteer' | 'security';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'command', label: '🏟 Command Center', color: 'var(--cyan)' },
  { id: 'fan', label: '👤 Fan Portal', color: 'var(--cyan)' },
  { id: 'volunteer', label: '👷 Volunteer', color: 'var(--amber)' },
  { id: 'security', label: '👮 Security', color: 'var(--crimson)' },
];

function App() {
  const [data, setData] = useState<IntelligencePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('command');

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/api/intelligence/stream');

    eventSource.onmessage = (event) => {
      try {
        const payload: IntelligencePayload = JSON.parse(event.data);
        setData(payload);
        setError(null);
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection to Pulse360 Core lost. Retrying...');
    };

    return () => eventSource.close();
  }, []);

  if (!data) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>INITIALIZING PULSE360 TELEMETRY LINK...</p>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="app">
      {/* Shared Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>PULSE<span>360</span></h1>
            <p>Predictive AI Stadium Intelligence · FIFA World Cup 2026</p>
          </div>
        </div>
        <div className="header-status">
          <div className="live-badge">
            <div className="live-dot" />
            LIVE TELEMETRY
          </div>
          <span className="timestamp">{new Date(data.telemetry.timestamp).toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={activeTab === tab.id ? { color: tab.color, borderColor: `${tab.color}55`, background: `${tab.color}15` } : {}}
          >
            <span className="tab-dot" style={activeTab === tab.id ? { background: tab.color } : {}} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Portal Views */}
      {activeTab === 'command' && <Dashboard data={data} />}
      {activeTab === 'fan' && <FanPortal data={data} />}
      {activeTab === 'volunteer' && <VolunteerPortal data={data} />}
      {activeTab === 'security' && <SecurityPortal data={data} />}
    </div>
  );
}

export default App;
