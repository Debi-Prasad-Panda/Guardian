export default function Overview() {
  return (
    <div className="page-container flex-col gap-4">
      <div className="topbar flex justify-between items-center pb-4 border-b border-light">
        <h2 className="text-body text-secondary">Guardian &gt; Overview</h2>
        <div className="metrics text-risk-safe">Saved Today: Rs. 3,42,000</div>
      </div>
      <div className="kpi-grid flex gap-4">
        <div className="card fill-remaining">
          <span className="text-xs text-secondary">Active Alerts</span>
          <div className="text-h2 text-risk-critical flex items-center gap-2">12 <span className="pulse-dot"></span></div>
        </div>
        <div className="card fill-remaining">
          <span className="text-xs text-secondary">At Risk</span>
          <div className="text-h2 text-risk-warning">47 <span className="text-sm text-secondary">/ 1,247</span></div>
        </div>
        <div className="card fill-remaining">
          <span className="text-xs text-secondary">Saved Today</span>
          <div className="text-h2 text-risk-safe">Rs. 3.4L</div>
        </div>
        <div className="card fill-remaining">
          <span className="text-xs text-secondary">Model AUC</span>
          <div className="text-h2 text-accent-blue">0.841</div>
        </div>
      </div>
    </div>
  );
}
