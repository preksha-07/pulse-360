import { useState, useCallback, useMemo } from 'react';
import type { IntelligencePayload, AgentRecommendation } from '../types';
import Widget from './Widget';

interface ScenarioInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const SCENARIOS: ScenarioInfo[] = [
  { id: 'heavy_rain', name: 'Heavy Rain', emoji: '🌧', description: 'Simulate high precipitation impacting gate entries and concourse slip risks.', color: 'var(--cyan)' },
  { id: 'metro_delay', name: 'Metro Delay', emoji: '🚇', description: 'Simulate a transit breakdown causing platform overcrowding at Gate 6.', color: 'var(--amber)' },
  { id: 'medical', name: 'Medical Emergency', emoji: '🚑', description: 'Simulate a cardiac alert in Concourse Section 104 requiring first aid routing.', color: 'var(--crimson)' },
  { id: 'gate_closure', name: 'Gate Closure', emoji: '🚪', description: 'Simulate a gate shutdown at Gate 6 redirecting flow to Gate 1.', color: 'var(--crimson)' },
  { id: 'vip', name: 'VIP Arrival', emoji: '⭐', description: 'Simulate high-profile delegation entry at VIP Gate 11 with secure escorts.', color: 'var(--cyan)' },
  { id: 'goal_surge', name: 'Goal Celebration', emoji: '⚽', description: 'Simulate a goal scoring event causing halftime runs to concessions and power peaks.', color: 'var(--emerald)' },
];

export default function ScenarioSimulator({ data }: { data: IntelligencePayload }) {
  const { telemetry, predictions, recommendations } = data;
  const activeScenario = telemetry.activeScenario || 'none';

  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [replayMarkdown, setReplayMarkdown] = useState<string | null>(null);
  const [loadingReplay, setLoadingReplay] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);

  // Trigger scenario injection on the server
  const handleInjectScenario = useCallback(async (scenarioId: string) => {
    setLoadingScenario(scenarioId);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${apiBase}/api/simulator/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });
    } catch (err) {
      console.error('Failed to inject scenario', err);
    } finally {
      setLoadingScenario(null);
    }
  }, []);

  // Reset scenario on the server
  const handleResetScenario = useCallback(async () => {
    setLoadingScenario('reset');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${apiBase}/api/simulator/reset`, { method: 'POST' });
      setReplayMarkdown(null);
      setShowReplayModal(false);
    } catch (err) {
      console.error('Failed to reset scenario', err);
    } finally {
      setLoadingScenario(null);
    }
  }, []);

  // Fetch the Incident Replay report
  const handleFetchIncidentReplay = useCallback(async () => {
    if (activeScenario === 'none') return;
    setLoadingReplay(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/ai/replay?scenario=${activeScenario}`);
      const json = await res.json();
      setReplayMarkdown(json.replay);
      setShowReplayModal(true);
    } catch (err) {
      console.error('Failed to fetch incident replay', err);
    } finally {
      setLoadingReplay(false);
    }
  }, [activeScenario]);

  // Calculate metrics (memoized for efficiency)
  const activeScenarioInfo = useMemo(() => {
    return SCENARIOS.find(s => s.id === activeScenario);
  }, [activeScenario]);

  // Global Risk Score derived dynamically from predictions
  const riskScore = useMemo(() => {
    const baseRisk = predictions.risks.length === 0 ? 12 : Math.min(100, 20 + predictions.risks.length * 28);
    if (activeScenario === 'none') return baseRisk;
    switch (activeScenario) {
      case 'gate_closure': return 92;
      case 'metro_delay': return 85;
      case 'heavy_rain': return 78;
      case 'goal_surge': return 74;
      case 'medical': return 62;
      default: return 48;
    }
  }, [activeScenario, predictions.risks.length]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Space Mono', fontSize: '1rem', color: 'var(--cyan)', letterSpacing: 3, marginBottom: 6 }}>🎛 WHAT-IF SCENARIO SIMULATOR</h2>
        <p style={{ color: 'var(--gray-300)', fontSize: '0.9rem' }}>Inject hypothetical crises to test the Pulse360 Decision Engine, watch predictions recalculate in real-time, and review AI mitigation actions.</p>
      </div>

      <div className="grid-3col">
        {/* COL 1: SCENARIO SELECTION */}
        <div className="col-gap">
          <Widget
            title="Inject Scenario Event"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>}
            badge={activeScenario !== 'none' ? { text: 'SIMULATION ACTIVE', color: 'crimson' } : { text: 'SYSTEM NORMAL', color: 'cyan' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SCENARIOS.map(sc => {
                const isSelected = activeScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleInjectScenario(sc.id)}
                    disabled={loadingScenario !== null}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: 14,
                      borderRadius: 10,
                      border: isSelected ? `1.5px solid ${sc.color}` : '1.5px solid var(--border)',
                      background: isSelected ? `${sc.color}0a` : 'rgba(0, 0, 0, 0.2)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    className="scenario-btn"
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: sc.color
                      }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '1.2rem' }}>{sc.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? sc.color : 'var(--gray-100)' }}>
                        {sc.name}
                      </span>
                      {isSelected && (
                        <span style={{
                          fontFamily: 'Space Mono', fontSize: '0.55rem', color: sc.color,
                          border: `1px solid ${sc.color}55`, borderRadius: 4, padding: '1px 6px', marginLeft: 6
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', lineHeight: 1.4 }}>{sc.description}</p>
                  </button>
                );
              })}

              {activeScenario !== 'none' && (
                <button
                  onClick={handleResetScenario}
                  disabled={loadingScenario !== null}
                  style={{
                    marginTop: 8,
                    padding: '12px',
                    borderRadius: 10,
                    background: 'var(--crimson-dim)',
                    border: '1.5px solid var(--crimson-glow)',
                    color: 'var(--crimson)',
                    fontWeight: 700,
                    fontFamily: 'Space Mono',
                    fontSize: '0.8rem',
                    letterSpacing: 2,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                  className="reset-btn"
                >
                  {loadingScenario === 'reset' ? 'Clearing...' : '⚠️ End & Reset Simulation'}
                </button>
              )}
            </div>
          </Widget>
        </div>

        {/* COL 2: REAL-TIME RECALCULATED METRICS */}
        <div className="col-gap">
          <Widget
            title="Recalculated AI Impact Scores"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Risk Score Gauge */}
              <div style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 16, textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: '0.65rem', color: 'var(--gray-400)', letterSpacing: 2, marginBottom: 8 }}>GLOBAL CRITICAL RISK SCORE</div>
                <div style={{
                  fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Space Mono',
                  color: riskScore > 75 ? 'var(--crimson)' : riskScore > 50 ? 'var(--amber)' : 'var(--emerald)',
                  textShadow: riskScore > 75 ? '0 0 16px var(--crimson-glow)' : 'none'
                }}>
                  {riskScore} <span style={{ fontSize: '1rem', color: 'var(--gray-500)' }}>/ 100</span>
                </div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--gray-300)', marginTop: 4, textTransform: 'uppercase', fontFamily: 'Space Mono'
                }}>
                  Severity Level: {riskScore > 75 ? '🔴 CRITICAL' : riskScore > 50 ? '🟡 HIGH' : '🟢 STABLE'}
                </div>
              </div>

              {/* Metrics Progress bars */}
              {[
                { label: 'Crowd Safety', value: telemetry.crowdSafety ?? 92, color: 'var(--cyan)' },
                { label: 'Transport Load', value: 100 - (telemetry.transportHealth ?? 81), color: 'var(--amber)' },
                { label: 'Security Risk', value: 100 - (telemetry.securityHealth ?? 95), color: 'var(--crimson)' },
                { label: 'Evacuation Readiness', value: telemetry.evacuationReadiness ?? 94, color: 'var(--emerald)' },
                { label: 'Volunteer Coverage', value: telemetry.volunteerCoverage ?? 90, color: 'var(--cyan)' }
              ].map(metric => {
                // Determine if warnings apply
                const isBad = (metric.label.includes('Risk') || metric.label.includes('Load')) ? metric.value > 65 : metric.value < 70;
                return (
                  <div key={metric.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                      <span style={{ color: 'var(--gray-200)' }}>{metric.label}</span>
                      <span style={{
                        fontFamily: 'Space Mono', fontWeight: 700,
                        color: isBad ? 'var(--crimson)' : 'var(--gray-300)'
                      }}>
                        {metric.value}% {isBad && '⚠️'}
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--gray-600)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: isBad ? 'var(--crimson)' : metric.color,
                        width: `${metric.value}%`, transition: 'width 0.8s ease'
                      }} />
                    </div>
                  </div>
                );
              })}

            </div>
          </Widget>
        </div>

        {/* COL 3: GEMINI PREDICTED IMPACT & DECISION ENGINE */}
        <div className="col-gap">
          <Widget
            title="AI Predicted Impact & Actions"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
          >
            {activeScenario === 'none' ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)', fontSize: '0.85rem'
              }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>🧪</span>
                Select a simulated crisis event on the left to review operational impacts.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Scenario details */}
                <div style={{
                  background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)',
                  borderRadius: 10, padding: 12, fontSize: '0.8rem'
                }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--amber)', letterSpacing: 2, marginBottom: 4 }}>SIMULATION PARAMETERS</div>
                  <strong style={{ color: '#fff' }}>Event:</strong> {activeScenarioInfo?.emoji} {activeScenarioInfo?.name}<br/>
                  <strong style={{ color: '#fff' }}>Forecast Horizon:</strong> 30 minutes
                </div>

                {/* Recommendations summary */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: 2, marginBottom: 8 }}>DECISION ENGINE ACTIONS</div>
                  {recommendations.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--gray-400)' }}>Calculating actions...</p>
                  ) : (
                    recommendations.map((rec: AgentRecommendation) => (
                      <div key={rec.id} style={{
                        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'Space Mono', fontSize: '0.58rem', color: 'var(--cyan)', fontWeight: 700 }}>{rec.domain.toUpperCase()}</span>
                          <span style={{ fontFamily: 'Space Mono', fontSize: '0.58rem', color: rec.priority === 'critical' ? 'var(--crimson)' : 'var(--amber)' }}>{rec.priority.toUpperCase()}</span>
                        </div>
                        <p style={{ color: 'var(--gray-100)', fontWeight: 500, marginBottom: 4 }}>{rec.action}</p>
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.72rem', lineHeight: 1.4 }}>Reason: {rec.reasoning}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Replay action */}
                <button
                  onClick={handleFetchIncidentReplay}
                  disabled={loadingReplay}
                  style={{
                    marginTop: 8,
                    padding: '12px',
                    borderRadius: 10,
                    background: 'var(--cyan-dim)',
                    border: '1.5px solid var(--cyan-glow)',
                    color: 'var(--cyan)',
                    fontWeight: 700,
                    fontFamily: 'Space Mono',
                    fontSize: '0.78rem',
                    letterSpacing: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                  className="replay-btn"
                >
                  {loadingReplay ? 'Generating...' : '📊 End Simulation & View Replay'}
                </button>

              </div>
            )}
          </Widget>
        </div>
      </div>

      {/* INCIDENT REPLAY MODAL OVERLAY */}
      {showReplayModal && replayMarkdown && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1.5px solid var(--border-bright)',
            borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontFamily: 'Space Mono', fontSize: '0.72rem', letterSpacing: 2, color: 'var(--cyan)' }}>✦ PULSE360 AI INCIDENT REPLAY</span>
              <button
                onClick={() => {
                  setShowReplayModal(false);
                  handleResetScenario(); // Auto reset scenario when closing replay modal
                }}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--gray-400)',
                  fontSize: '1.2rem', cursor: 'pointer', outline: 'none'
                }}
              >✕</button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '24px', overflowY: 'auto', flex: 1, color: 'var(--gray-200)',
              lineHeight: 1.7, fontSize: '0.88rem'
            }} className="replay-markdown">
              {/* Rendering markdown details in a styled format */}
              <div dangerouslySetInnerHTML={{
                __html: replayMarkdown
                  .replace(/# (.*)/g, '<h1 style="color:var(--cyan);font-family:\'Space Mono\';font-size:1.4rem;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:8px">$1</h1>')
                  .replace(/### (.*)/g, '<h3 style="color:var(--amber);font-family:\'Space Mono\';font-size:0.95rem;margin-top:20px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">$1</h3>')
                  .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff">$1</strong>')
                  .replace(/\* \*\*(.*?)\*\* (.*)/g, '<li style="margin-bottom:8px"><strong style="color:var(--cyan)">$1</strong> $2</li>')
                  .replace(/---\n/g, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>')
                  .replace(/(\r?\n){2,}/g, '<br/><br/>')
              }} />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: 12,
              background: 'rgba(0,0,0,0.2)'
            }}>
              <button
                onClick={() => {
                  setShowReplayModal(false);
                  handleResetScenario();
                }}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: 'var(--cyan-dim)', border: '1px solid var(--cyan-glow)',
                  color: 'var(--cyan)', fontWeight: 700, fontFamily: 'Space Mono',
                  fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                  textTransform: 'uppercase'
                }}
              >
                Clear Scenario & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
