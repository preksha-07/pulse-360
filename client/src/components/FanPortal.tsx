import { useState, useRef, useEffect } from 'react';
import type { IntelligencePayload } from '../types';
import Widget from './Widget';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const LANGUAGES = ['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'German', 'Japanese', 'Korean'];

function getCapClass(v: number) {
  if (v >= 85) return 'crit';
  if (v >= 65) return 'warn';
  return 'ok';
}

export default function FanPortal({ data }: { data: IntelligencePayload }) {
  const { telemetry } = data;
  const { gates, zones, transport } = telemetry;

  const bestGate = [...gates].sort((a, b) => a.capacityPercent - b.capacityPercent)[0];
  const nextMetro = transport.find(t => t.type === 'metro');
  const nearestBus = transport.find(t => t.type === 'bus');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hi! I'm Pulse, your AI matchday assistant. Ask me about gates, queues, food, transport, or accessibility — in any language!" }
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('English');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/ai/fan-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language: lang })
      });
      const json = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: json.reply || 'Sorry, I could not get a response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Unable to connect to assistant right now.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Space Mono', fontSize: '1rem', color: 'var(--cyan)', letterSpacing: 3, marginBottom: 6 }}>FAN PORTAL</h2>
        <p style={{ color: 'var(--gray-300)', fontSize: '0.9rem' }}>Your AI-powered matchday companion — personalized, predictive, and accessible.</p>
      </div>

      <div className="grid-2col" style={{ marginBottom: 18 }}>
        {/* AI Recommended Gate */}
        <Widget
          title="AI-Recommended Entry"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>}
          badge={{ text: 'PERSONALIZED', color: 'cyan' }}
        >
          <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid var(--cyan-glow)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', letterSpacing: 3, color: 'var(--cyan)', marginBottom: 8 }}>OPTIMAL GATE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>{bestGate?.name}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                { icon: '⏱', label: `${bestGate?.queueTimeMinutes} min wait`, color: 'var(--emerald)' },
                { icon: '👥', label: `${bestGate?.capacityPercent}% capacity`, color: 'var(--gray-300)' },
                { icon: '♿', label: 'Accessible', color: 'var(--cyan)' },
              ].map(item => (
                <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: item.color }}>
                  {item.icon} {item.label}
                </span>
              ))}
            </div>
            <div style={{ width: '100%', height: 4, background: 'var(--gray-600)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'var(--emerald)', width: `${bestGate?.capacityPercent}%`, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: '0.8rem', color: 'var(--gray-300)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--amber)', fontFamily: 'Space Mono', fontSize: '0.6rem', letterSpacing: 2 }}>AI SAYS: </span>
              Best option right now. {gates.filter(g => g.id !== bestGate?.id).map(g => g.name).join(' and ')} have higher loads — up to {Math.max(...gates.map(g => g.capacityPercent)) - (bestGate?.capacityPercent || 0)}% more crowded.
            </div>
          </div>
        </Widget>

        {/* Smart Transport */}
        <Widget
          title="Smart Transport"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nextMetro && (
              <div style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>🚇 Metro</span>
                  <span style={{ fontFamily: 'Space Mono', color: 'var(--amber)', fontSize: '1.3rem', fontWeight: 700 }}>
                    {Math.floor(nextMetro.nextArrivalMinutes)}m
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-300)', lineHeight: 1.5 }}>
                  {nextMetro.expectedPassengers} passengers expected.{' '}
                  {nextMetro.nextArrivalMinutes <= 10 ? '⚠️ Arrive early to beat the surge at Gate 6.' : 'Good window — platform should be comfortable.'}
                </p>
              </div>
            )}
            {nearestBus && (
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>🚌 Shuttle Bus</span>
                  <span style={{ fontFamily: 'Space Mono', color: 'var(--gray-300)', fontSize: '1.1rem', fontWeight: 700 }}>
                    {Math.floor(nearestBus.nextArrivalMinutes)}m
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-300)' }}>Low crowd. Recommended for accessibility needs.</p>
              </div>
            )}
            {/* Zones summary */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: '0.6rem', letterSpacing: 2, color: 'var(--gray-400)', marginBottom: 8 }}>CONCOURSE STATUS</div>
              {zones.map(z => {
                const cls = getCapClass(z.crowdDensityPercent);
                const dot = cls === 'crit' ? 'var(--crimson)' : cls === 'warn' ? 'var(--amber)' : 'var(--emerald)';
                return (
                  <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                      {z.name}
                    </span>
                    <span style={{ fontFamily: 'Space Mono', color: dot, fontSize: '0.8rem' }}>{z.crowdDensityPercent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>
      </div>

      {/* AI Multilingual Chat Assistant */}
      <Widget
        title="Pulse AI — Multilingual Stadium Assistant"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
        badge={{ text: 'GEMINI AI', color: 'cyan' }}
      >
        {/* Language selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '4px 12px', borderRadius: 20, border: '1px solid',
                fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.2s',
                background: lang === l ? 'var(--cyan-dim)' : 'transparent',
                borderColor: lang === l ? 'var(--cyan-glow)' : 'var(--border)',
                color: lang === l ? 'var(--cyan)' : 'var(--gray-400)',
                fontFamily: 'Inter, sans-serif'
              }}
            >{l}</button>
          ))}
        </div>

        {/* Chat messages */}
        <div style={{ minHeight: 180, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, paddingRight: 4 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 12, fontSize: '0.85rem', lineHeight: 1.6,
              maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--cyan-dim)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${msg.role === 'user' ? 'var(--cyan-glow)' : 'var(--border)'}`,
              color: msg.role === 'user' ? 'var(--cyan)' : 'var(--gray-100)'
            }}>
              {msg.role === 'ai' && (
                <div style={{ fontFamily: 'Space Mono', fontSize: '0.58rem', letterSpacing: 1, color: 'var(--amber)', marginBottom: 4 }}>PULSE AI ✦</div>
              )}
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ padding: '10px 14px', borderRadius: 12, maxWidth: '80%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', alignSelf: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`, display: 'block' }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Ask anything in ${lang}...`}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px',
              background: 'var(--bg-dark)', border: '1px solid var(--border-bright)',
              borderRadius: 10, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
              outline: 'none', transition: 'border-color 0.2s'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 20px', background: 'var(--cyan-dim)',
              border: '1px solid var(--cyan-glow)', borderRadius: 10,
              color: 'var(--cyan)', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
              opacity: loading || !input.trim() ? 0.5 : 1
            }}
          >
            Send →
          </button>
        </div>
      </Widget>
    </div>
  );
}
