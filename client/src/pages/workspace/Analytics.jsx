import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const SAVINGS_DATA = [
  { day: 'Mon', savings: 120000, interventions: 8 },
  { day: 'Tue', savings: 98000, interventions: 6 },
  { day: 'Wed', savings: 210000, interventions: 14 },
  { day: 'Thu', savings: 175000, interventions: 11 },
  { day: 'Fri', savings: 340000, interventions: 22 },
  { day: 'Sat', savings: 88000, interventions: 5 },
  { day: 'Sun', savings: 218000, interventions: 13 },
];

const CARRIER_DATA = [
  { name: 'Blue Dart', onTime: 94, delayed: 6, cancellations: 1 },
  { name: 'DHL', onTime: 91, delayed: 8, cancellations: 1.5 },
  { name: 'FedEx IN', onTime: 88, delayed: 10, cancellations: 2 },
  { name: 'DTDC', onTime: 79, delayed: 18, cancellations: 3 },
];

const MODEL_METRICS = [
  { label: 'AUC-ROC', value: '0.841', color: 'var(--accent-blue)', desc: 'XGBoost Tower 1' },
  { label: 'F1 Score', value: '0.89', color: 'var(--risk-safe)', desc: 'Conformal-calibrated' },
  { label: 'Precision', value: '0.91', color: 'var(--risk-safe)', desc: 'Critical tier alerts' },
  { label: 'Recall', value: '0.87', color: 'var(--risk-warning)', desc: 'Catching all delays' },
  { label: 'Coverage', value: '90%', color: 'var(--accent-blue)', desc: 'Conformal sets' },
  { label: 'Training Rows', value: '1.18M', color: 'var(--text-secondary)', desc: 'Synthetic + real data' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.dataKey === 'savings' ? `₹${(p.value / 1000).toFixed(0)}K` : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  return (
    <div className="page-container flex-col gap-6">
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-medium)' }}>
        <div className="text-xs text-secondary mb-1">Guardian › Analytics</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Analytics & Reports</h1>
      </div>

      {/* Model Metrics */}
      <section>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Model Performance</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
          {MODEL_METRICS.map((m, i) => (
            <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: 4 }}>{m.label}</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem' }}>📈 Daily Savings (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SAVINGS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-medium)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="savings" name="Savings" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem' }}>⚡ Daily Interventions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={SAVINGS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-medium)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="interventions" name="Interventions" stroke="var(--risk-warning)" strokeWidth={2} dot={{ r: 4, fill: 'var(--risk-warning)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Carrier Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem' }}>🚚 Carrier Performance Benchmarks</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Carrier', 'On-Time Rate', 'Delay Rate', 'Cancellations', 'Rating'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-medium)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CARRIER_DATA.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-medium)' }}>
                <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--risk-safe)', fontWeight: 700 }}>{c.onTime}%</td>
                <td style={{ padding: '0.875rem 1rem', color: c.delayed > 10 ? 'var(--risk-warning)' : 'var(--text-secondary)' }}>{c.delayed}%</td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>{c.cancellations}%</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ color: star <= Math.round(c.onTime / 20) ? '#F59E0B' : 'var(--bg-elevated)', fontSize: '0.875rem' }}>★</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
