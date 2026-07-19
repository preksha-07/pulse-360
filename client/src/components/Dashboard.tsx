import { useState, useEffect, useMemo, memo } from 'react';
import type { IntelligencePayload, GateData, RiskPrediction, AgentRecommendation, ZoneData, VolunteerData, TimelineRecommendation } from '../types';
import Widget from './Widget';

// ── helpers ──────────────────────────────────────────────────────────────────

function getCapClass(v: number) {
  if (v >= 85) return 'crit';
  if (v >= 65) return 'warn';
  return 'ok';
}

// ── sub-components ────────────────────────────────────────────────────────────

const GateCard = memo(function GateCard({ gate }: { gate: GateData }) {
  const cls = getCapClass(gate.capacityPercent);
  const isClosed = gate.capacityPercent === 0;
  return (
    <div className={`gate-card ${cls === 'crit' ? 'critical' : ''}`} style={isClosed ? { opacity: 0.5 } : {}}>
      <div className="gate-header">
        <span className="gate-name">{gate.name}</span>
        <span className={`gate-percent ${isClosed ? '' : cls}`}>
          {isClosed ? 'CLOSED' : `${gate.capacityPercent}%`}
        </span>
      </div>
      {!isClosed && (
        <div className="progress-bar">
          <div className={`progress-fill ${cls}`} style={{ width: `${gate.capacityPercent}%` }} />
        </div>
      )}
      <div className="gate-meta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>{isClosed ? 'N/A' : `${gate.queueTimeMinutes} min wait`}</span>
      </div>
    </div>
  );
});

const RiskCard = memo(function RiskCard({ risk }: { risk: RiskPrediction }) {
  return (
    <div className="risk-card" style={risk.category === 'emergency_alert' ? { background: 'rgba(255, 59, 59, 0.2)', borderColor: 'var(--crimson)' } : {}}>
      <div className="risk-header">
        <span className="risk-title" style={risk.category === 'emergency_alert' ? { color: '#ff5f5f' } : {}}>{risk.title}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="risk-conf" style={{
            fontSize: '0.6rem',
            background: 'rgba(255,255,255,0.08)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Space Mono',
            color: 'var(--gray-300)'
          }}>
            Conf: {risk.confidencePercent || 94}%
          </span>
          <span className="risk-prob" style={risk.category === 'emergency_alert' ? { background: 'var(--crimson)' } : {}}>{risk.probabilityPercent}% PROB</span>
        </div>
      </div>
      <ul className="risk-reasons">
        {risk.reasoning.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      <div className="risk-impact" style={risk.category === 'emergency_alert' ? { color: '#ff5f5f' } : {}}>
        ⚡ IMPACT IN: {risk.timeToImpactMinutes === 0 ? 'IMMEDIATE' : `${risk.timeToImpactMinutes} MINS`}
      </div>
    </div>
  );
});

const RecCard = memo(function RecCard({ rec }: { rec: AgentRecommendation }) {
  return (
    <div className="rec-card">
      <div className="rec-stripe" style={rec.priority === 'critical' ? { background: 'var(--crimson)' } : {}} />
      <div className="rec-top">
        <span className="rec-domain">{rec.domain} AGENT</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="rec-confidence" style={{
            fontSize: '0.62rem',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--gray-300)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            fontFamily: 'Space Mono'
          }}>
            {rec.confidencePercent || 92}% CONFIDENCE
          </span>
          <span className={`rec-priority ${rec.priority}`}>{rec.priority}</span>
        </div>
      </div>
      <p className="rec-action">{rec.action}</p>
      <div className="rec-reason">
        <div className="rec-reason-label">REASON</div>
        <p>{rec.reasoning}</p>
      </div>
      <button className="rec-btn">✓ EXECUTE ACTION</button>
    </div>
  );
});

const ChartBars = memo(function ChartBars({ gateId, current, timeline }: { gateId: string; current: number; timeline: { gates: Record<string, { timeOffsetMinutes: number; value: number; confidencePercent: number }[]> } }) {
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
});

const TimelineItemView = memo(function TimelineItemView({ item, isLast }: { item: TimelineRecommendation; isLast: boolean }) {
  return (
    <div className="timeline-item" style={{
      display: 'flex', gap: 12, marginBottom: isLast ? 0 : 16, position: 'relative'
    }}>
      {/* Node bullet */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative'
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--cyan-dim)', border: '1.5px solid var(--cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontFamily: 'Space Mono', color: 'var(--cyan)',
          fontWeight: 700, zIndex: 2
        }}>
          {item.label === 'Now' ? 'Now' : `+${item.timeOffsetMinutes}`}
        </div>
        {!isLast && (
          <div style={{
            position: 'absolute', top: 28, bottom: -20, width: 1.5, background: 'var(--border)', zIndex: 1
          }} />
        )}
      </div>
      {/* Box */}
      <div style={{
        flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-100)' }}>{item.title}</span>
          <span style={{
            fontSize: '0.58rem', fontFamily: 'Space Mono', color: 'var(--cyan)',
            background: 'var(--cyan-dim)', padding: '1px 5px', borderRadius: 4
          }}>
            {item.confidencePercent}% CONF
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-300)', lineHeight: 1.4 }}>{item.action}</p>
      </div>
    </div>
  );
});

const ZoneCard = memo(function ZoneCard({ zone }: { zone: ZoneData }) {
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
});

const VolunteerItem = memo(function VolunteerItem({ vol }: { vol: VolunteerData }) {
  const initials = vol.name.split(' ').map(n => n[0]).join('');
  return (
    <div className="volunteer-item">
      <div className="volunteer-avatar">{initials}</div>
      <div>
        <div className="volunteer-name">{vol.name}</div>
        <div className="volunteer-zone">{vol.zoneId === 'z_north' ? 'North Concourse' : vol.zoneId === 'z_south' ? 'South Concourse' : 'Food Court A'}</div>
      </div>
      <span className={`volunteer-status ${vol.status}`}>{vol.status}</span>
    </div>
  );
});

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard({ data }: { data: IntelligencePayload }) {
  const { telemetry, predictions, recommendations } = data;
  const { gates, zones, transport, sustainability, volunteers } = telemetry;

  // KPI data (memoized for efficiency)
  const { activeGates, avgGateCap, criticalRisks, activeVolunteers, nextMetro } = useMemo(() => {
    const actGates = gates.filter(g => g.capacityPercent > 0);
    const avgCap = actGates.length > 0
      ? Math.round(actGates.reduce((s, g) => s + g.capacityPercent, 0) / actGates.length)
      : 0;
    const critRisks = predictions.risks.length;
    const actVols = volunteers.filter(v => v.status === 'active').length;
    const metro = transport.find(t => t.type === 'metro');
    return { activeGates: actGates, avgGateCap: avgCap, criticalRisks: critRisks, activeVolunteers: actVols, nextMetro: metro };
  }, [gates, predictions.risks.length, volunteers, transport]);

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
    const interval = setInterval(fetchBriefing, 10000); // refresh every 10s to sync simulation changes fast
    return () => clearInterval(interval);
  }, []);

  return (
    <div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card cyan">
          <div className="kpi-label">Avg Gate Capacity</div>
          <div className="kpi-value cyan">{avgGateCap}%</div>
          <div className="kpi-sub">{activeGates.length} gates active</div>
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
          <svg style={{ marginTop: 8 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
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
            badge={{ text: telemetry.activeScenario !== 'none' ? 'SIMULATION' : 'LIVE', color: telemetry.activeScenario !== 'none' ? 'crimson' : 'cyan' }}
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

        {/* COL 2: Predictions & Timelines */}
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
            title="Operational Timeline & AI Forecast"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            badge={{ text: 'FORECAST', color: 'cyan' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
              {predictions.timelineRecommendations && predictions.timelineRecommendations.length > 0 ? (
                predictions.timelineRecommendations.map((item, index) => (
                  <TimelineItemView
                    key={item.timeOffsetMinutes}
                    item={item}
                    isLast={index === (predictions.timelineRecommendations?.length ?? 0) - 1}
                  />
                ))
              ) : (
                <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--gray-400)' }}>No timeline forecasts available.</p>
              )}
            </div>
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

      {/* Stadium Health Score Bottom Panel */}
      <div className="stadium-health-panel" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 20, marginTop: 20, display: 'flex', gap: 24, alignItems: 'center',
        flexWrap: 'wrap', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--cyan-glow), transparent)'
        }} />
        
        {/* Circle Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--cyan-dim)', border: '2px solid var(--cyan)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--cyan-glow)', flexShrink: 0
          }}>
            <span style={{ fontFamily: 'Space Mono', fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan)' }}>
              {telemetry.stadiumHealth || 87}
            </span>
            <span style={{ fontSize: '0.55rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Health</span>
          </div>
          <div>
            <h4 style={{ fontFamily: 'Space Mono', fontSize: '0.72rem', letterSpacing: 2, color: 'var(--gray-100)', textTransform: 'uppercase', marginBottom: 2 }}>AI Stadium Health Score</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Aggregated real-time metrics summarizing safety, coverage, and transport efficiency.</p>
          </div>
        </div>

        {/* Sub-metrics */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, minWidth: 280 }} className="sub-health-grid">
          {[
            { label: 'Crowd Safety', value: telemetry.crowdSafety || 92, color: 'var(--cyan)' },
            { label: 'Transport Efficiency', value: telemetry.transportHealth || 81, color: 'var(--amber)' },
            { label: 'Security Health', value: telemetry.securityHealth || 96, color: 'var(--crimson)' },
            { label: 'Volunteer Coverage', value: telemetry.volunteerCoverage || 88, color: 'var(--emerald)' }
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 6, fontFamily: 'Space Mono' }}>
                <span style={{ color: 'var(--gray-400)', textTransform: 'uppercase' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{item.value}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--gray-600)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: item.color, width: `${item.value}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
