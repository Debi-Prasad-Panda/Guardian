import { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

const ALL_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', carrier: 'Blue Dart', tier: 'CRITICAL', risk: 87, eta: '2026-03-13', value: '₹4.2L', weight: '1,240 kg' },
  { id: 'SHP_047', route: 'Mumbai → Chennai', carrier: 'FedEx IN', tier: 'PRIORITY', risk: 52, eta: '2026-03-12', value: '₹1.8L', weight: '320 kg' },
  { id: 'SHP_093', route: 'Delhi → Kolkata', carrier: 'DTDC', tier: 'STANDARD', risk: 18, eta: '2026-03-14', value: '₹0.6L', weight: '90 kg' },
  { id: 'SHP_112', route: 'Chennai → Pune', carrier: 'DHL', tier: 'CRITICAL', risk: 92, eta: '2026-03-12', value: '₹7.1L', weight: '2,100 kg' },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', carrier: 'Blue Dart', tier: 'PRIORITY', risk: 65, eta: '2026-03-15', value: '₹2.3L', weight: '480 kg' },
  { id: 'SHP_330', route: 'Hyderabad → Jaipur', carrier: 'DTDC', tier: 'STANDARD', risk: 11, eta: '2026-03-16', value: '₹0.4L', weight: '60 kg' },
  { id: 'SHP_451', route: 'Pune → Ahmedabad', carrier: 'FedEx IN', tier: 'PRIORITY', risk: 58, eta: '2026-03-13', value: '₹3.0L', weight: '750 kg' },
  { id: 'SHP_502', route: 'Delhi → Bangalore', carrier: 'DHL', tier: 'STANDARD', risk: 22, eta: '2026-03-17', value: '₹1.1L', weight: '200 kg' },
];

const TIER_ORDER = { CRITICAL: 0, PRIORITY: 1, STANDARD: 2 };

function RiskBar({ value }) {
  const color = value >= 75 ? 'var(--risk-critical)' : value >= 45 ? 'var(--risk-warning)' : 'var(--risk-safe)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color, fontWeight: 600, minWidth: 32 }}>{value}%</span>
    </div>
  );
}

export default function Shipments() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('risk');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let rows = ALL_SHIPMENTS.filter(s => {
      const matchSearch = !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.route.toLowerCase().includes(search.toLowerCase()) || s.carrier.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === 'ALL' || s.tier === tierFilter;
      return matchSearch && matchTier;
    });
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'tier') { av = TIER_ORDER[av]; bv = TIER_ORDER[bv]; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [search, tierFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleExport = () => {
    const headers = 'ID,Route,Carrier,Tier,Risk %,ETA,Value,Weight\n';
    const rows = filtered.map(s => `${s.id},${s.route},${s.carrier},${s.tier},${s.risk},${s.eta},${s.value},${s.weight}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'guardian_shipments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  return (
    <div className="page-container flex-col gap-4">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-medium)' }}>
        <div>
          <div className="text-xs text-secondary mb-1">Guardian › Shipments</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Shipment Monitor</h1>
        </div>
        <button onClick={handleExport} className="btn btn-outline flex items-center gap-2 text-sm" style={{ padding: '0.5rem 1rem' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, route, carrier..." style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 32 : 10, paddingTop: '0.5rem', paddingBottom: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none' }}><X size={12} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'CRITICAL', 'PRIORITY', 'STANDARD'].map(t => (
            <button key={t} onClick={() => setTierFilter(t)} style={{ padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: tierFilter === t ? (t === 'CRITICAL' ? 'var(--risk-critical-bg)' : t === 'PRIORITY' ? 'var(--risk-warning-bg)' : t === 'STANDARD' ? 'var(--bg-elevated)' : 'var(--accent-blue)') : 'var(--bg-secondary)', color: tierFilter === t ? (t === 'CRITICAL' ? 'var(--risk-critical)' : t === 'PRIORITY' ? 'var(--risk-warning)' : t === 'STANDARD' ? 'var(--text-secondary)' : 'white') : 'var(--text-secondary)', border: `1px solid ${tierFilter === t ? 'transparent' : 'var(--border-medium)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t === 'ALL' ? `All (${ALL_SHIPMENTS.length})` : t}
            </button>
          ))}
        </div>
        <div className="text-sm text-secondary">
          <Filter size={13} style={{ display: 'inline', marginRight: 4 }} />{filtered.length} results
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {[['id', 'Shipment ID'], ['route', 'Route'], ['carrier', 'Carrier'], ['tier', 'Tier'], ['risk', 'Risk Score'], ['eta', 'ETA'], ['value', 'Value']].map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-medium)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{label}<SortIcon col={key} /></span>
                </th>
              ))}
              <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-medium)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} onClick={() => setSelected(selected?.id === s.id ? null : s)} style={{ background: selected?.id === s.id ? 'rgba(59,130,246,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'background 0.1s', borderBottom: '1px solid var(--border-medium)' }}
                onMouseEnter={e => { if (selected?.id !== s.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (selected?.id !== s.id) e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'; }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>{s.id}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>{s.route}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.carrier}</td>
                <td style={{ padding: '0.75rem 1rem' }}><span className={`badge badge-${s.tier.toLowerCase()}`}>{s.tier}</span></td>
                <td style={{ padding: '0.75rem 1rem', minWidth: 140 }}><RiskBar value={s.risk} /></td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.eta}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{s.value}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={e => { e.stopPropagation(); setSelected(s); }}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No shipments match your filters.</p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>📦 {selected.id} — Detail</h3>
            <button onClick={() => setSelected(null)} style={{ color: 'var(--text-secondary)', background: 'none' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {[['Route', selected.route], ['Carrier', selected.carrier], ['ETA', selected.eta], ['Value', selected.value], ['Weight', selected.weight], ['Risk Score', `${selected.risk}%`]].map(([k, v]) => (
              <div key={k} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-medium)' }}>
                <div className="text-xs text-secondary mb-1">{k}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-medium)' }}>
            <div className="text-xs text-secondary mb-2">AI Recommendation</div>
            <p style={{ fontSize: '0.875rem' }}>
              {selected.risk >= 75
                ? '🚨 CRITICAL: Reassign to alternate carrier immediately. Expected delay: +18 hrs without action. Estimated savings: ₹68,000.'
                : selected.risk >= 45
                ? '⚠️ PRIORITY: Pre-book buffer slot at destination. Monitor port status at 6hr intervals.'
                : '✅ LOW RISK: No intervention required. Standard monitoring continues.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
