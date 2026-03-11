import { useState } from 'react';
import { AlertTriangle, Package, TrendingUp, Activity, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import MapView from '../../components/workspace/MapView';

const MOCK_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 },
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 },
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 },
  { id: 'SHP_112', route: 'Chennai → Pune', tier: 'CRITICAL', risk_score: 92, longitude: 73.8567, latitude: 18.5204 },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', tier: 'PRIORITY', risk_score: 65, longitude: 72.8777, latitude: 19.0760 },
];

const RECENT_ALERTS = [
  { id: 'SHP_112', route: 'CHN → PNE', risk: 92, tier: 'CRITICAL', change: '+14%' },
  { id: 'SHP_001', route: 'BLR → DEL', risk: 87, tier: 'CRITICAL', change: '+8%' },
  { id: 'SHP_214', route: 'CCU → BOM', risk: 65, tier: 'PRIORITY', change: '+3%' },
  { id: 'SHP_047', route: 'BOM → MAA', risk: 52, tier: 'PRIORITY', change: '-2%' },
];

const KPI_CARDS = [
  { label: 'Active Alerts', value: '12', sub: '4 new in last hour', icon: AlertTriangle, color: 'var(--risk-critical)', pulse: true },
  { label: 'At Risk', value: '47', sub: 'of 1,247 monitored', icon: Package, color: 'var(--risk-warning)', pulse: false },
  { label: 'Saved Today', value: '₹3.4L', sub: '↑ 23% vs yesterday', icon: TrendingUp, color: 'var(--risk-safe)', pulse: false },
  { label: 'Model AUC', value: '0.841', sub: '90% conformal coverage', icon: Activity, color: 'var(--accent-blue)', pulse: false },
];

export default function Overview() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="page-container flex-col gap-6">
      {/* Top Bar */}
      <div className="topbar flex justify-between items-center pb-4" style={{ borderBottom: '1px solid var(--border-medium)' }}>
        <div>
          <div className="text-xs text-secondary mb-1">Guardian &gt; Overview</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Command Center</h1>
        </div>
        <button onClick={handleRefresh} className="btn btn-outline flex items-center gap-2 text-sm" style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {KPI_CARDS.map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-secondary">{kpi.label}</span>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</span>
              {kpi.pulse && <span className="pulse-dot"></span>}
            </div>
            <span className="text-xs text-secondary">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Map + Alerts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', minHeight: 380 }}>
        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 380 }}>
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, pointerEvents: 'none' }}>
            <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
              📍 Live Risk Map
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none' }}>
            <LegendDot color="var(--risk-critical)" label="Critical" />
            <LegendDot color="var(--risk-warning)" label="Priority" />
            <LegendDot color="var(--risk-safe)" label="Standard" />
          </div>
          <MapView shipments={MOCK_SHIPMENTS} />
        </div>

        {/* Recent Alerts */}
        <div className="card flex-col" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontWeight: 600 }}>Recent Alerts</span>
            <Link to="/workspace/shipments" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {RECENT_ALERTS.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem', borderRadius: 6, background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{a.id}</div>
                <div className="text-xs text-secondary">{a.route}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-${a.tier.toLowerCase()}`}>{a.risk}%</span>
                <div style={{ fontSize: '0.65rem', marginTop: 2, color: a.change.startsWith('+') ? 'var(--risk-critical)' : 'var(--risk-safe)' }}>{a.change}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 8px', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '0.65rem', color: '#ccc' }}>{label}</span>
    </div>
  );
}
