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

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const nextIndex = (index + 1) % TABS.length;
      setActiveTab(TABS[nextIndex].id);
      setTimeout(() => document.getElementById(`tab-${TABS[nextIndex].id}`)?.focus(), 0);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (index - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[prevIndex].id);
      setTimeout(() => document.getElementById(`tab-${TABS[prevIndex].id}`)?.focus(), 0);
    }
  };

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const eventSource = new EventSource(`${apiBase}/api/intelligence/stream`);

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
      <div className="tabs" role="tablist" aria-label="Portal Navigation">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={activeTab === tab.id ? { color: tab.color, borderColor: `${tab.color}55`, background: `${tab.color}15` } : {}}
          >
            <span className="tab-dot" style={activeTab === tab.id ? { background: tab.color } : {}} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Portal Views */}
      <main id="portal-content">
        <div id="command-panel" role="tabpanel" aria-labelledby="tab-command" hidden={activeTab !== 'command'}>
          {activeTab === 'command' && <Dashboard data={data} />}
        </div>
        <div id="fan-panel" role="tabpanel" aria-labelledby="tab-fan" hidden={activeTab !== 'fan'}>
          {activeTab === 'fan' && <FanPortal data={data} />}
        </div>
        <div id="volunteer-panel" role="tabpanel" aria-labelledby="tab-volunteer" hidden={activeTab !== 'volunteer'}>
          {activeTab === 'volunteer' && <VolunteerPortal data={data} />}
        </div>
        <div id="security-panel" role="tabpanel" aria-labelledby="tab-security" hidden={activeTab !== 'security'}>
          {activeTab === 'security' && <SecurityPortal data={data} />}
        </div>
      </main>
    </div>
  );
}

export default App;
