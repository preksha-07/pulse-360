import type { IntelligencePayload } from '../types';
import Widget from './Widget';

export default function VolunteerPortal({ data }: { data: IntelligencePayload }) {
  const { telemetry, predictions, recommendations } = data;
  const { volunteers, zones } = telemetry;

  const volunteerRecs = recommendations.filter(r => r.domain === 'volunteer');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Space Mono', fontSize: '1rem', color: 'var(--amber)', letterSpacing: 3, marginBottom: 6 }}>VOLUNTEER PORTAL</h2>
        <p style={{ color: 'var(--gray-300)', fontSize: '0.9rem' }}>AI-powered task assignments and dynamic redeployment based on live crowd conditions.</p>
      </div>

      <div className="grid-2col">
        {/* Volunteer Assignments */}
        <Widget
          title="Active Roster"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        >
          {volunteers.map(v => {
            const initials = v.name.split(' ').map(n => n[0]).join('');
            const zone = zones.find(z => z.id === v.zoneId);
            const zoneLoad = zone?.crowdDensityPercent || 0;
            const needsMove = zoneLoad > 70;
            return (
              <div key={v.id} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${needsMove ? 'var(--amber-dim)' : 'var(--border)'}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid var(--cyan-glow)',
                    fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, fontFamily: 'Space Mono'
                  }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                      Zone: {zone?.name || v.zoneId} · Density: {zoneLoad}%
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.65rem', padding: '3px 10px', borderRadius: 6, fontWeight: 600, letterSpacing: 1,
                    background: v.status === 'active' ? 'var(--emerald-dim)' : v.status === 'reassigning' ? 'var(--amber-dim)' : 'rgba(0,0,0,0.3)',
                    color: v.status === 'active' ? 'var(--emerald)' : v.status === 'reassigning' ? 'var(--amber)' : 'var(--gray-400)',
                    border: `1px solid ${v.status === 'active' ? 'rgba(0,230,118,0.3)' : 'rgba(255,193,7,0.3)'}`
                  }}>{v.status.toUpperCase()}</span>
                </div>
                {needsMove && (
                  <div style={{ marginTop: 10, background: 'var(--amber-dim)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: 'var(--amber)' }}>
                    ⚡ AI suggests reassignment — zone is crowded
                  </div>
                )}
              </div>
            );
          })}
        </Widget>

        {/* AI Assignments */}
        <div className="col-gap">
          <Widget
            title="AI Task Assignments"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
            badge={{ text: volunteerRecs.length > 0 ? `${volunteerRecs.length} ACTIONS` : 'STANDBY', color: volunteerRecs.length > 0 ? 'crimson' : 'cyan' }}
          >
            {volunteerRecs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)' }}>
                <p style={{ fontSize: '0.85rem' }}>✓ All volunteers optimally placed</p>
              </div>
            ) : (
              volunteerRecs.map(r => (
                <div key={r.id} style={{ background: 'var(--amber-dim)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', letterSpacing: 2, color: 'var(--amber)', marginBottom: 6 }}>VOLUNTEER AGENT</div>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>{r.action}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-300)', marginBottom: 10 }}>{r.reasoning}</p>
                  <button style={{
                    width: '100%', padding: 8, borderRadius: 8, background: 'rgba(255,193,7,0.1)',
                    border: '1px solid rgba(255,193,7,0.3)', color: 'var(--amber)',
                    fontFamily: 'Space Mono', fontSize: '0.7rem', letterSpacing: 2, cursor: 'pointer'
                  }}>ACKNOWLEDGE & DEPLOY</button>
                </div>
              ))
            )}
          </Widget>

          <Widget title="Zone Overview" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>}>
            {zones.map(z => {
              const density = z.crowdDensityPercent;
              const volsInZone = volunteers.filter(v => v.zoneId === z.id).length;
              const color = density >= 85 ? 'var(--crimson)' : density >= 65 ? 'var(--amber)' : 'var(--emerald)';
              return (
                <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem' }}>{z.name}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Space Mono', fontSize: '0.8rem', color }}>Density: {density}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>👷 {volsInZone}</span>
                  </div>
                </div>
              );
            })}
          </Widget>

          <Widget title="Upcoming Risks" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}>
            {predictions.risks.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--emerald)', textAlign: 'center', padding: '12px 0' }}>✓ No risks forecasted</p>
            ) : (
              predictions.risks.map(r => (
                <div key={r.id} style={{ background: 'var(--crimson-dim)', border: '1px solid var(--crimson-glow)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ color: 'var(--crimson)', fontWeight: 600, marginBottom: 4, fontSize: '0.85rem' }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-300)' }}>Impact in {r.timeToImpactMinutes} min · {r.probabilityPercent}% probability</div>
                </div>
              ))
            )}
          </Widget>
        </div>
      </div>
    </div>
  );
}
