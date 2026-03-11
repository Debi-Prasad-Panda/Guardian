import { useState } from 'react';
import MapView from '../../components/workspace/MapView';
import { Zap, RotateCcw, AlertTriangle, TrendingDown } from 'lucide-react';

const BASE_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 },
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 },
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 },
  { id: 'SHP_112', route: 'Chennai → Pune', tier: 'CRITICAL', risk_score: 92, longitude: 73.8567, latitude: 18.5204 },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', tier: 'PRIORITY', risk_score: 65, longitude: 72.8777, latitude: 19.0760 },
];

const PRESETS = [
  { id: 'normal', label: 'Normal Ops', color: 'var(--risk-safe)', weather: 2, port: 0, carrier: 0 },
  { id: 'suez', label: 'Suez Blockage', color: 'var(--risk-critical)', weather: 7, port: 80, carrier: 20 },
  { id: 'cyclone', label: 'Bay of Bengal Cyclone', color: 'var(--risk-warning)', weather: 10, port: 50, carrier: 10 },
  { id: 'strike', label: 'Mumbai Port Strike', color: 'var(--risk-critical)', weather: 1, port: 95, carrier: 5 },
];

export default function ChaosLab() {
  const [weather, setWeather] = useState(3);
  const [portStrike, setPortStrike] = useState(0);
  const [carrierFail, setCarrierFail] = useState(0);
  const [injected, setInjected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [shipments, setShipments] = useState(BASE_SHIPMENTS);
  const [activePreset, setActivePreset] = useState('normal');

  const applyPreset = (p) => {
    setActivePreset(p.id);
    setWeather(p.weather);
    setPortStrike(p.port);
    setCarrierFail(p.carrier);
    setInjected(false);
    setResult(null);
    setShipments(BASE_SHIPMENTS);
  };

  const handleInject = () => {
    setLoading(true);
    setInjected(false);
    setTimeout(() => {
      const boost = (weather / 10) * 0.4 + (portStrike / 100) * 0.4 + (carrierFail / 100) * 0.2;
      const newShipments = BASE_SHIPMENTS.map(s => ({
        ...s,
        risk_score: Math.min(99, Math.round(s.risk_score + boost * 40)),
        tier: Math.min(99, Math.round(s.risk_score + boost * 40)) >= 75 ? 'CRITICAL' : Math.min(99, Math.round(s.risk_score + boost * 40)) >= 45 ? 'PRIORITY' : 'STANDARD',
      }));
      const affected = newShipments.filter(s => s.risk_score >= 75).length;
      setShipments(newShipments);
      setResult({ affected, interventions: affected, savings: affected * 68000 + Math.round(Math.random() * 50000) });
      setInjected(true);
      setLoading(false);
    }, 1600);
  };

  const handleReset = () => {
    setShipments(BASE_SHIPMENTS);
    setWeather(3); setPortStrike(0); setCarrierFail(0);
    setInjected(false); setResult(null); setActivePreset('normal');
  };

  return (
    <div className="page-container flex-col gap-4">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-medium)' }}>
        <div>
          <div className="text-xs text-secondary mb-1">Guardian › Chaos Lab</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Chaos Simulator</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: injected ? 'var(--risk-critical)' : 'var(--risk-safe)', display: 'inline-block', animation: injected ? 'pulse 1.5s infinite' : 'none' }}></span>
          <span className="text-sm text-secondary">{injected ? 'Disruption Active' : 'System Ready'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', minHeight: 520 }}>
        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 520 }}>
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
            <span style={{ background: injected ? 'rgba(239,68,68,0.15)' : 'var(--bg-secondary)', border: `1px solid ${injected ? 'rgba(239,68,68,0.4)' : 'var(--border-medium)'}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none' }}>
              {injected ? '⚡ Disruption Injected' : '🗺️ Live Routing Map'}
            </span>
          </div>
          <MapView shipments={shipments} />
        </div>

        {/* Control Panel */}
        <div className="card flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Scenario Parameters</h3>

          {/* Presets */}
          <div>
            <div className="text-xs text-secondary mb-2">Quick Presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => applyPreset(p)} style={{ padding: '0.4rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, border: `1px solid ${activePreset === p.id ? p.color : 'var(--border-medium)'}`, background: activePreset === p.id ? `color-mix(in srgb, ${p.color} 15%, transparent)` : 'var(--bg-primary)', color: activePreset === p.id ? p.color : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-medium)' }} />

          {/* Sliders */}
          <SliderControl label="Weather Severity" value={weather} min={1} max={10} onChange={setWeather} unit="/10" colorFn={v => v >= 7 ? 'var(--risk-critical)' : v >= 4 ? 'var(--risk-warning)' : 'var(--risk-safe)'} />
          <SliderControl label="Port Strike Probability" value={portStrike} min={0} max={100} onChange={setPortStrike} unit="%" colorFn={v => v >= 60 ? 'var(--risk-critical)' : v >= 30 ? 'var(--risk-warning)' : 'var(--risk-safe)'} />
          <SliderControl label="Carrier Failure Risk" value={carrierFail} min={0} max={100} onChange={setCarrierFail} unit="%" colorFn={v => v >= 60 ? 'var(--risk-critical)' : v >= 30 ? 'var(--risk-warning)' : 'var(--risk-safe)'} />

          <div style={{ height: 1, background: 'var(--border-medium)' }} />

          {/* Actions */}
          <button onClick={handleInject} disabled={loading} style={{ padding: '0.875rem', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', color: loading ? 'var(--text-secondary)' : 'white', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            <Zap size={16} />
            {loading ? 'Injecting disruption...' : '⚡ INJECT CHAOS'}
          </button>
          {injected && <button onClick={handleReset} className="btn btn-outline flex items-center gap-2" style={{ padding: '0.5rem', justifyContent: 'center', fontSize: '0.875rem' }}><RotateCcw size={14} /> Reset Scenario</button>}

          {/* Results */}
          {result && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
              <div className="text-xs text-secondary mb-2 flex items-center gap-1"><AlertTriangle size={11} style={{ color: 'var(--risk-critical)' }} /> Impact Analysis</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ResultStat label="Affected" value={result.affected} color="var(--risk-critical)" />
                <ResultStat label="Interventions" value={result.interventions} color="var(--risk-warning)" />
                <ResultStat label="Est. Savings" value={`₹${(result.savings / 1000).toFixed(0)}K`} color="var(--risk-safe)" />
                <ResultStat label="Avg Risk Δ" value={`+${Math.round((weather / 10 + portStrike / 100) * 20)}%`} color="var(--risk-critical)" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, onChange, unit, colorFn }) {
  const color = colorFn(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="slider" style={{ accentColor: color }} />
    </div>
  );
}

function ResultStat({ label, value, color }) {
  return (
    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 6 }}>
      <div className="text-xs text-secondary">{label}</div>
      <div style={{ fontWeight: 700, color, fontSize: '1rem' }}>{value}</div>
    </div>
  );
}
