import { useState, useEffect } from 'react';
import type { IntelligencePayload, GateData, RiskPrediction, AgentRecommendation, ZoneData, VolunteerData } from '../types';
import Widget from './Widget';

// ── helpers ──────────────────────────────────────────────────────────────────

function getCapClass(v: number) {
  if (v >= 85) return 'crit';
  if (v >= 65) return 'warn';
  return 'ok';
}

// ── sub-components ────────────────────────────────────────────────────────────

function GateCard({ gate }: { gate: GateData }) {
  const cls = getCapClass(gate.capacityPercent);
  return (
    <div className={`gate-card ${cls === 'crit' ? 'critical' : ''}`}>
      <div className="gate-header">
        <span className="gate-name">{gate.name}</span>
        <span className={`gate-percent ${cls}`}>{gate.capacityPercent}%</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${cls}`} style={{ width: `${gate.capacityPercent}%` }} />
      </div>
      <div className="gate-meta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>{gate.queueTimeMinutes} min wait</span>
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskPrediction }) {
  return (
    <div className="risk-card">
      <div className="risk-header">
        <span className="risk-title">{risk.title}</span>
        <span className="risk-prob">{risk.probabilityPercent}% PROB</span>
      </div>
      <ul className="risk-reasons">
        {risk.reasoning.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      <div className="risk-impact">
        ⚡ IMPACT IN: {risk.timeToImpactMinutes} MINS
      </div>
    </div>
  );
}

function RecCard({ rec }: { rec: AgentRecommendation }) {
  return (
    <div className="rec-card">
      <div className="rec-stripe" />
      <div className="rec-top">
        <span className="rec-domain">{rec.domain} AGENT</span>
        <span className={`rec-priority ${rec.priority}`}>{rec.priority}</span>
      </div>
      <p className="rec-action">{rec.action}</p>
      <div className="rec-reason">
        <div className="rec-reason-label">REASON</div>
        <p>{rec.reasoning}</p>
      </div>
      <button className="rec-btn">✓ EXECUTE ACTION</button>
    </div>
  );
}

function ChartBars({ gateId, current, timeline }: { gateId: string; current: number; timeline: { gates: Record<string, { timeOffsetMinutes: number; value: number }[]> } }) {
  const pts = timeline.gates[gateId] || [];
  const bars = [
    { label: 'Now', value: current },
    ...pts.map(p => ({ label: `+${p.timeOffsetMinutes}m`, value: p.value }))
  ];
  return (
    <div className="chart-area">
      <div className="chart-bars">
        {bars.map(b => {
          const h = (b.value / 100) * 130;
          const cls = b.value >= 85 ? 'crit' : '';
          return (
            <div className="chart-bar-wrap" key={b.label}>
              <span className="chart-bar-val">{b.value}%</span>
              <div className={`chart-bar ${cls}`} style={{ height: `${h}px` }} />
              <span className="chart-bar-label">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ZoneCard({ zone }: { zone: ZoneData }) {
  const cls = getCapClass(zone.crowdDensityPercent);
  return (
    <div className="zone-card">
      <div className="zone-header">
        <span>{zone.name}</span>
        <span className={`zone-density ${cls === 'crit' ? 'gate-percent crit' : cls === 'warn' ? 'gate-percent warn' : 'gate-percent ok'}`}>{zone.crowdDensityPercent}%</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${cls}`} style={{ width: `${zone.crowdDensityPercent}%` }} />
      </div>
    </div>
  );
}

function VolunteerItem({ vol }: { vol: VolunteerData }) {
  const initials = vol.name.split(' ').map(n => n[0]).join('');
  return (
    <div className="volunteer-item">
      <div className="volunteer-avatar">{initials}</div>
      <div>
        <div className="volunteer-name">{vol.name}</div>
        <div className="volunteer-zone">{vol.zoneId}</div>
      </div>
      <span className={`volunteer-status ${vol.status}`}>{vol.status}</span>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard({ data }: { data: IntelligencePayload }) {
  const { telemetry, predictions, recommendations } = data;
  const { gates, zones, transport, sustainability, volunteers } = telemetry;

  // KPI data
  const avgGateCap = Math.round(gates.reduce((s, g) => s + g.capacityPercent, 0) / gates.length);
  const criticalRisks = predictions.risks.length;
  const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
  const nextMetro = transport.find(t => t.type === 'metro');

  // AI Briefing
  const [briefing, setBriefing] = useState<string>('Fetching operational briefing...');
  const [briefingTime, setBriefingTime] = useState<string>('');

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/ai/briefing`);
        const json = await res.json();
        setBriefing(json.briefing);
        setBriefingTime(new Date(json.generatedAt).toLocaleTimeString());
      } catch {
        setBriefing('Briefing unavailable. Check server connection.');
      }
    };
    fetchBriefing();
    const interval = setInterval(fetchBriefing, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card cyan">
          <div className="kpi-label">Avg Gate Capacity</div>
          <div className="kpi-value cyan">{avgGateCap}%</div>
          <div className="kpi-sub">{gates.length} gates monitored</div>
        </div>
        <div className="kpi-card crimson">
          <div className="kpi-label">Active Risks</div>
          <div className="kpi-value crimson">{criticalRisks}</div>
          <div className="kpi-sub">AI-forecasted threats</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-label">Volunteers Active</div>
          <div className="kpi-value emerald">{activeVolunteers}</div>
          <div className="kpi-sub">of {volunteers.length} deployed</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-label">Next Metro Surge</div>
          <div className="kpi-value amber">{nextMetro ? Math.floor(nextMetro.nextArrivalMinutes) : '--'}m</div>
          <div className="kpi-sub">{nextMetro?.expectedPassengers} passengers expected</div>
        </div>
      </div>

      {/* AI Operational Briefing */}
      <div style={{
        background: 'rgba(0,229,255,0.04)', border: '1px solid var(--cyan-glow)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 14
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 8,
          background: 'var(--cyan-dim)', border: '1px solid var(--cyan-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', letterSpacing: 2, color: 'var(--amber)', textTransform: 'uppercase' }}>Gemini AI · Operational Briefing</span>
            {briefingTime && <span style={{ fontFamily: 'Space Mono', fontSize: '0.55rem', color: 'var(--gray-400)' }}>Last updated: {briefingTime}</span>}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--gray-100)', lineHeight: 1.7 }}>{briefing}</p>
        </div>
      </div>

      {/* Main 3-col grid */}
      <div className="grid-3col">

        {/* COL 1: Live Operations */}
        <div className="col-gap">
          <Widget
            title="Gate Operations"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            badge={{ text: 'LIVE', color: 'cyan' }}
          >
            {gates.map(g => <GateCard key={g.id} gate={g} />)}
          </Widget>

          <Widget
            title="Zone Crowd Density"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          >
            {zones.map(z => <ZoneCard key={z.id} zone={z} />)}
          </Widget>
        </div>

        {/* COL 2: Predictions */}
        <div className="col-gap">
          <Widget
            title="Predictive Timeline · Gate 6"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          >
            <ChartBars
              gateId="g6"
              current={gates.find(g => g.id === 'g6')?.capacityPercent || 0}
              timeline={predictions.timeline}
            />
          </Widget>

          <Widget
            title="Upcoming Risks"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            badge={predictions.risks.length > 0 ? { text: `${predictions.risks.length} ACTIVE`, color: 'crimson' } : undefined}
          >
            {predictions.risks.length === 0
              ? <p className="no-risk">✓ No critical risks forecasted.</p>
              : predictions.risks.map(r => <RiskCard key={r.id} risk={r} />)
            }
          </Widget>

          <Widget
            title="Transport Arrivals"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
          >
            {transport.map(t => (
              <div className="transport-item" key={t.id}>
                <div className="transport-type">
                  <span className="transport-icon">{t.type === 'metro' ? '🚇' : '🚌'}</span>
                  {t.type}
                </div>
                <span className="transport-arrival">{Math.floor(t.nextArrivalMinutes)} min</span>
                <span className="transport-pax">{t.expectedPassengers} pax</span>
              </div>
            ))}
          </Widget>
        </div>

        {/* COL 3: AI Recommendations + Volunteers + Sustainability */}
        <div className="col-gap">
          <Widget
            title="AI Coordinator Actions"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
          >
            {recommendations.length === 0
              ? <p className="no-risk">✓ No actions required.</p>
              : recommendations.map(r => <RecCard key={r.id} rec={r} />)
            }
          </Widget>

          <Widget
            title="Volunteer Roster"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          >
            {volunteers.map(v => <VolunteerItem key={v.id} vol={v} />)}
          </Widget>

          <Widget
            title="Sustainability"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.75 2C2.75 2 6 5.75 6 9.5C6 13.64 3.5 17 3.5 17L6 16.5C8 16.5 9.5 14.5 9.5 14.5C9.5 14.5 11 19 15 21C19 23 22 19 22 16C22 13 19 11 17 11C15 11 14 12 14 12C14 12 14 8.5 11.5 5.5C9 2.5 2.75 2 2.75 2Z"/></svg>}
          >
            <div className="sust-item">
              <div className="sust-header"><span>⚡ Energy</span><span className="sust-value">{sustainability.energyUsageKw} kW</span></div>
              <div className="sust-bar"><div className="sust-fill" style={{ width: `${Math.min(100, sustainability.energyUsageKw / 60)}%` }} /></div>
            </div>
            <div className="sust-item">
              <div className="sust-header"><span>💧 Water</span><span className="sust-value">{sustainability.waterUsageLiters.toLocaleString()} L</span></div>
              <div className="sust-bar"><div className="sust-fill" style={{ width: `${Math.min(100, sustainability.waterUsageLiters / 200)}%` }} /></div>
            </div>
            <div className="sust-item">
              <div className="sust-header"><span>🗑 Waste</span><span className="sust-value">{sustainability.wasteKg} kg</span></div>
              <div className="sust-bar"><div className="sust-fill" style={{ width: `${Math.min(100, sustainability.wasteKg / 10)}%` }} /></div>
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}
