import { useState } from 'react';
import { AlertTriangle, Clock, Anchor } from 'lucide-react';

const PORTS = [
  { name: 'Mumbai JNPT', code: 'INNSA', congestion: 8.2, delay: '+18 hrs', waitTime: 32, demurrage: '₹2.1L', vessels: 47, status: 'CRITICAL', trend: 'worsening', lat: 18.9498, lng: 72.9372 },
  { name: 'Chennai Port', code: 'INMAA', congestion: 4.1, delay: '+3 hrs', waitTime: 12, demurrage: '₹28,000', vessels: 22, status: 'WARNING', trend: 'stable', lat: 13.0827, lng: 80.2873 },
  { name: 'Kolkata KDS', code: 'INKOL', congestion: 2.3, delay: '+1 hr', waitTime: 6, demurrage: '₹8,000', vessels: 14, status: 'NORMAL', trend: 'improving', lat: 22.5726, lng: 88.3271 },
  { name: 'Jawaharlal Nehru Port', code: 'INNHV', congestion: 6.5, delay: '+9 hrs', waitTime: 22, demurrage: '₹78,000', vessels: 33, status: 'WARNING', trend: 'worsening', lat: 18.9539, lng: 72.9493 },
  { name: 'Visakhapatnam Port', code: 'INVTZ', congestion: 1.8, delay: 'On time', waitTime: 3, demurrage: '₹0', vessels: 9, status: 'NORMAL', trend: 'stable', lat: 17.6868, lng: 83.2185 },
];

const statusStyles = {
  CRITICAL: { bg: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', border: 'rgba(239,68,68,0.3)' },
  WARNING: { bg: 'var(--risk-warning-bg)', color: 'var(--risk-warning)', border: 'rgba(245,158,11,0.3)' },
  NORMAL: { bg: 'var(--risk-safe-bg)', color: 'var(--risk-safe)', border: 'rgba(34,197,94,0.3)' },
};

const trendIcon = (t) => t === 'worsening' ? '↑' : t === 'improving' ? '↓' : '→';
const trendColor = (t) => t === 'worsening' ? 'var(--risk-critical)' : t === 'improving' ? 'var(--risk-safe)' : 'var(--text-secondary)';

export default function Ports() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="page-container flex-col gap-6">
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-medium)' }}>
        <div className="text-xs text-secondary mb-1">Guardian › Ports</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Port Congestion Monitor</h1>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-secondary">Critical Ports</span><AlertTriangle size={14} style={{ color: 'var(--risk-critical)' }} /></div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--risk-critical)' }}>1</div>
          <span className="text-xs text-secondary">of 5 monitored</span>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-secondary">Avg Wait Time</span><Clock size={14} style={{ color: 'var(--risk-warning)' }} /></div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--risk-warning)' }}>15 hrs</div>
          <span className="text-xs text-secondary">across all ports</span>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-secondary">Total Demurrage Risk</span><Anchor size={14} style={{ color: 'var(--accent-blue)' }} /></div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>₹3.2L</div>
          <span className="text-xs text-secondary">across affected routes</span>
        </div>
      </div>

      {/* Port Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {PORTS.map(port => {
          const style = statusStyles[port.status];
          const isActive = selected?.code === port.code;
          return (
            <div key={port.code} onClick={() => setSelected(isActive ? null : port)} style={{ padding: '1.25rem', background: isActive ? 'rgba(59,130,246,0.05)' : 'var(--bg-secondary)', border: `1px solid ${isActive ? 'rgba(59,130,246,0.4)' : 'var(--border-medium)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = ''; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Anchor size={14} style={{ color: style.color }} />
                    {port.name}
                  </div>
                  <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{port.code}</div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 9999, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{port.status}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <PortStat label="Congestion Index" value={port.congestion} unit="/10" color={port.congestion >= 7 ? 'var(--risk-critical)' : port.congestion >= 4 ? 'var(--risk-warning)' : 'var(--risk-safe)'} />
                <PortStat label="Expected Delay" value={port.delay} color={port.delay.includes('+') ? 'var(--risk-warning)' : 'var(--risk-safe)'} />
                <PortStat label="Wait Time" value={`${port.waitTime} hrs`} color="var(--text-secondary)" />
                <PortStat label="Demurrage Risk" value={port.demurrage} color={port.demurrage === '₹0' ? 'var(--risk-safe)' : 'var(--text-primary)'} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{port.vessels} vessels</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trendColor(port.trend) }}>
                  {trendIcon(port.trend)} {port.trend}
                </span>
              </div>

              {/* Congestion bar */}
              <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', marginTop: '0.75rem' }}>
                <div style={{ width: `${(port.congestion / 10) * 100}%`, height: '100%', background: style.color, transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Port Detail */}
      {selected && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.03)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📍 {selected.name} — AI Analysis</h3>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
            {selected.status === 'CRITICAL'
              ? `🚨 CRITICAL CONGESTION: ${selected.name} is experiencing severe congestion (index ${selected.congestion}/10). All shipments routed through this port face ${selected.delay} delay. Immediate recommendation: Pre-reroute via alternate inland route or delay dispatch by 24 hours.`
              : selected.status === 'WARNING'
              ? `⚠️ ELEVATED RISK: ${selected.name} shows elevated congestion (index ${selected.congestion}/10) with a projected ${selected.delay} delay. Monitor vessel queue every 4 hours. Pre-book buffer slots.`
              : `✅ NORMAL OPERATIONS: ${selected.name} is operating at normal capacity (index ${selected.congestion}/10). No rerouting required. Continue standard monitoring.`}
          </div>
        </div>
      )}
    </div>
  );
}

function PortStat({ label, value, unit = '', color }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: color || 'var(--text-primary)' }}>{value}{unit}</div>
    </div>
  );
}
