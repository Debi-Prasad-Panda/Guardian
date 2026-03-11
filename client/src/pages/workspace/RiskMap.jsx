import MapView from '../../components/workspace/MapView';

const MOCK_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 },
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 },
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 },
  { id: 'SHP_112', route: 'Chennai → Pune', tier: 'CRITICAL', risk_score: 92, longitude: 73.8567, latitude: 18.5204 },
  { id: 'SHP_214', route: 'Kolkata → Mumbai', tier: 'PRIORITY', risk_score: 65, longitude: 72.8777, latitude: 19.0760 },
  { id: 'SHP_330', route: 'Hyderabad → Jaipur', tier: 'STANDARD', risk_score: 11, longitude: 75.7873, latitude: 26.9124 },
];

const HEATMAP_DATA = [
  ['Route', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  ['BLR→DEL', 42, 55, 78, 87, 91],
  ['BOM→MAA', 30, 38, 48, 52, 50],
  ['DEL→CCU', 12, 15, 18, 18, 22],
  ['CHN→PNE', 60, 70, 85, 90, 92],
];

export default function RiskMap() {
  return (
    <div className="page-container flex-col gap-4" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-medium)' }}>
        <div>
          <div className="text-xs text-secondary mb-1">Guardian › Risk Map</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Live Risk Map</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <LegendDot color="var(--risk-critical)" label="Critical (≥75%)" />
          <LegendDot color="var(--risk-warning)" label="Priority (≥45%)" />
          <LegendDot color="var(--risk-safe)" label="Standard (<45%)" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', flex: 1, minHeight: 'calc(100vh - 160px)' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 500 }}>
          <MapView shipments={MOCK_SHIPMENTS} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem' }}>Risk Tier Breakdown</div>
            <TierBar tier="CRITICAL" count={2} total={6} color="var(--risk-critical)" />
            <TierBar tier="PRIORITY" count={2} total={6} color="var(--risk-warning)" />
            <TierBar tier="STANDARD" count={2} total={6} color="var(--risk-safe)" />
          </div>
          <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem' }}>Risk Heatmap (5 days)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  {HEATMAP_DATA[0].map((h, i) => (
                    <th key={i} style={{ padding: '4px 6px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEATMAP_DATA.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{row[0]}</td>
                    {row.slice(1).map((v, vi) => (
                      <td key={vi} style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, borderRadius: 4, color: 'white', background: v >= 75 ? 'var(--risk-critical)' : v >= 45 ? 'var(--risk-warning)' : v >= 20 ? 'rgba(34,197,94,0.5)' : 'var(--bg-elevated)' }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function TierBar({ tier, count, total, color }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', color }}>{tier}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{count} / {total}</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}
