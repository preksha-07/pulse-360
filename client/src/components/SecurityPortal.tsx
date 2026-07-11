import type { IntelligencePayload } from '../types';
import Widget from './Widget';

function getHeatClass(v: number) {
  if (v >= 85) return 'high';
  if (v >= 60) return 'med';
  return 'low';
}

export default function SecurityPortal({ data }: { data: IntelligencePayload }) {
  const { telemetry, predictions, recommendations } = data;
  const { gates, zones } = telemetry;
  const emergencyRecs = recommendations.filter(r => r.domain === 'emergency' || r.domain === 'crowd');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Space Mono', fontSize: '1rem', color: 'var(--crimson)', letterSpacing: 3, marginBottom: 6 }}>SECURITY PORTAL</h2>
        <p style={{ color: 'var(--gray-300)', fontSize: '0.9rem' }}>Predictive crowd surge alerts, heatmaps, and AI-driven emergency response planning.</p>
      </div>

      <div className="grid-2col" style={{ marginBottom: 18 }}>
        {/* Crowd Heatmap */}
        <Widget
          title="Live Crowd Heatmap"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>}
          badge={{ text: 'REAL-TIME', color: 'cyan' }}
        >
          <div className="heatmap">
            {zones.map(z => (
              <div key={z.id} className={`heatmap-cell ${getHeatClass(z.crowdDensityPercent)}`}>
                <div className="cell-name">{z.name}</div>
                <div className="cell-val">{z.crowdDensityPercent}%</div>
              </div>
            ))}
            {gates.map(g => (
              <div key={g.id} className={`heatmap-cell ${getHeatClass(g.capacityPercent)}`}>
                <div className="cell-name">{g.name.split(' ')[0] + ' ' + g.name.split(' ')[1]}</div>
                <div className="cell-val">{g.capacityPercent}%</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--gray-400)' }}>
            <span style={{ color: 'var(--emerald)' }}>■ SAFE (&lt;60%)</span>
            <span style={{ color: 'var(--amber)' }}>■ ELEVATED (60–85%)</span>
            <span style={{ color: 'var(--crimson)' }}>■ CRITICAL (&gt;85%)</span>
          </div>
        </Widget>

        {/* Risk Panel */}
        <Widget
          title="Predicted Threats"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          badge={predictions.risks.length > 0 ? { text: `${predictions.risks.length} THREATS`, color: 'crimson' } : undefined}
        >
          {predictions.risks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--emerald)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
              <p style={{ fontSize: '0.85rem' }}>All clear. No threats detected.</p>
            </div>
          ) : (
            predictions.risks.map(r => (
              <div key={r.id} style={{ background: 'var(--crimson-dim)', border: '1px solid var(--crimson-glow)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--crimson)', fontSize: '0.92rem' }}>{r.title}</span>
                  <span style={{ background: 'var(--crimson)', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, fontFamily: 'Space Mono', whiteSpace: 'nowrap' }}>{r.probabilityPercent}%</span>
                </div>
                <ul style={{ listStyle: 'disc', paddingLeft: 16, fontSize: '0.78rem', color: 'var(--gray-300)', lineHeight: 1.7 }}>
                  {r.reasoning.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
                <div style={{ marginTop: 8, fontFamily: 'Space Mono', fontSize: '0.62rem', color: 'var(--crimson)', letterSpacing: 2 }}>
                  ⚡ IMPACT IN {r.timeToImpactMinutes} MINUTES
                </div>
              </div>
            ))
          )}
        </Widget>
      </div>

      {/* Evacuation simulation + AI Actions */}
      <div className="grid-2col">
        <Widget
          title="Evacuation Simulation"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--gray-400)', letterSpacing: 2, marginBottom: 6 }}>CURRENT</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: '2rem', fontWeight: 700, color: 'var(--crimson)' }}>18m</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>Evacuation time</div>
            </div>
            <div style={{ background: 'var(--emerald-dim)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--emerald)', letterSpacing: 2, marginBottom: 6 }}>AI OPTIMIZED</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: '2rem', fontWeight: 700, color: 'var(--emerald)' }}>13m</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>-27% improvement</div>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--amber)', letterSpacing: 2, marginBottom: 8 }}>AI EVACUATION PLAN</div>
            {['Open all 12 emergency exits simultaneously', 'Direct North Stand to Gate 1 & Gate 11', 'Activate PA multilingual announcements', 'Deploy all 20 floor stewards to aisles'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: '0.8rem', color: 'var(--gray-300)' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--amber-dim)', border: '1px solid rgba(255,193,7,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--amber)', flexShrink: 0 }}>{i + 1}</span>
                {item}
              </div>
            ))}
          </div>
          <button style={{
            width: '100%', padding: 10, borderRadius: 10,
            background: 'var(--crimson-dim)', border: '1px solid var(--crimson-glow)',
            color: 'var(--crimson)', fontFamily: 'Space Mono', fontSize: '0.72rem',
            letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase'
          }}>🚨 ACTIVATE DRILL MODE</button>
        </Widget>

        <Widget
          title="Security AI Actions"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        >
          {emergencyRecs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--emerald)' }}>No security actions required.</p>
            </div>
          ) : (
            emergencyRecs.map(r => (
              <div key={r.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--crimson-glow)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--crimson)', letterSpacing: 2 }}>CROWD AGENT</span>
                  <span style={{ fontSize: '0.65rem', background: 'var(--crimson-dim)', color: 'var(--crimson)', border: '1px solid var(--crimson-glow)', padding: '2px 8px', borderRadius: 4 }}>{r.priority.toUpperCase()}</span>
                </div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>{r.action}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-300)', marginBottom: 10 }}>{r.reasoning}</p>
                <button style={{
                  width: '100%', padding: 8, borderRadius: 8,
                  background: 'var(--crimson-dim)', border: '1px solid var(--crimson-glow)',
                  color: 'var(--crimson)', fontFamily: 'Space Mono', fontSize: '0.65rem', letterSpacing: 2, cursor: 'pointer'
                }}>EXECUTE</button>
              </div>
            ))
          )}
          {/* Gate status summary */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--gray-400)', letterSpacing: 2, marginBottom: 10 }}>GATE STATUS</div>
            {gates.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem' }}>{g.name}</span>
                <span style={{
                  fontFamily: 'Space Mono', fontSize: '0.75rem',
                  color: g.capacityPercent >= 85 ? 'var(--crimson)' : g.capacityPercent >= 65 ? 'var(--amber)' : 'var(--emerald)'
                }}>{g.capacityPercent}%</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
