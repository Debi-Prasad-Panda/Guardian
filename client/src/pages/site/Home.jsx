import { Link } from 'react-router';
import { ShieldAlert, Zap, BarChart2, Map, ChevronRight, Github } from 'lucide-react';

const features = [
  { icon: ShieldAlert, title: 'AI Risk Scoring', desc: '72-hour delay prediction with 84.1% AUC accuracy using XGBoost + conformal prediction.' },
  { icon: Zap, title: 'Chaos Simulator', desc: 'Inject real-world disruptions (port strikes, weather, carrier failure) and see ripple effects live.' },
  { icon: Map, title: 'Live Risk Map', desc: 'Geographic heatmap of all active shipments, colored by tier: Critical, Priority, Standard.' },
  { icon: BarChart2, title: 'Analytics Engine', desc: 'SHAP-explainable features, ROC curves, intervention ROI tracking, and carrier benchmarks.' },
];

const stats = [
  { value: '84.1%', label: 'Model AUC' },
  { value: '72hrs', label: 'Prediction Horizon' },
  { value: '₹12.4L', label: 'Avg. Savings / Alert' },
  { value: '1.18M', label: 'Training Rows' },
];

export default function Home() {
  return (
    <div className="home-container">
      {/* HERO */}
      <section className="hero flex-col items-center justify-center text-center" style={{ minHeight: 'calc(100vh - 65px)', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 2rem' }}>
          <div className="badge badge-standard mb-6" style={{ display: 'inline-flex', marginBottom: '1.5rem', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            🛡️ INNOVATE X 5.0 &nbsp;·&nbsp; AI/ML Track
          </div>
          <h1 className="text-h1 mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.1 }}>
            Predict shipment delays<br />
            <span style={{ color: 'var(--accent-blue)' }}>before they happen.</span>
          </h1>
          <p className="text-secondary mb-10" style={{ fontSize: '1.125rem', maxWidth: 540, margin: '0 auto 2.5rem' }}>
            Guardian is an AI-powered early warning system that gives logistics operators a 48–72 hour head start on delays — and an actionable intervention plan.
          </p>
          <div className="flex gap-4 items-center justify-center flex-wrap">
            <Link to="/workspace" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Launch Workspace <ChevronRight size={18} />
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github size={16} /> View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar" style={{ borderTop: '1px solid var(--border-medium)', borderBottom: '1px solid var(--border-medium)', padding: '2rem 0', background: 'var(--bg-secondary)' }}>
        <div className="flex justify-center gap-0 flex-wrap" style={{ maxWidth: 900, margin: '0 auto' }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-item text-center" style={{ flex: '1 1 180px', padding: '1rem 2rem', borderRight: i < stats.length - 1 ? '1px solid var(--border-medium)' : 'none' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem' }}>
        <h2 className="text-h2 text-center mb-2">Everything you need to prevent delays</h2>
        <p className="text-secondary text-center mb-12">Four integrated modules that work together.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={i} className="card feature-card" style={{ padding: '1.75rem', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = ''; }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <f.icon size={22} color="var(--accent-blue)" />
              </div>
              <h3 className="text-body font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,64,175,0.1) 100%)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, margin: '0 2rem 6rem', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 className="text-h2 mb-4">Ready to protect your supply chain?</h2>
        <Link to="/workspace" className="btn btn-primary" style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}>
          Open the Dashboard →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-medium)', padding: '2rem', textAlign: 'center' }}>
        <p className="text-xs text-secondary">Guardian · Built for INNOVATE X 5.0 · Kimi K2.5 · XGBoost · FastAPI · React</p>
      </footer>
    </div>
  );
}
