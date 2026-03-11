import MapView from '../../components/workspace/MapView';

const MOCK_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 }, 
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 }, 
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 }, 
];

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
      
      <div className="flex gap-4">
        <div className="card fill-remaining min-w-[300px]">
          <h3 className="text-body font-semibold mb-4">Recent Alerts</h3>
          <div className="flex-col gap-2">
            <div className="flex justify-between items-center p-2 rounded bg-bg-primary border border-border-medium">
              <div className="flex flex-col">
                <span className="font-bold text-sm">SHP_001</span>
                <span className="text-xs text-secondary">BLR → DEL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-critical">87%</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-bg-primary border border-border-medium">
              <div className="flex flex-col">
                <span className="font-bold text-sm">SHP_047</span>
                <span className="text-xs text-secondary">MUM → CHN</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-priority">52%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card fill-remaining p-0 overflow-hidden relative min-h-[300px]">
          <div className="p-4 absolute top-0 left-0 z-10 w-full pointer-events-none">
            <h3 className="text-body font-semibold opacity-80 backdrop-blur-md inline-block px-2 py-1 rounded bg-bg-secondary border border-border-medium">Quick Risk Map</h3>
          </div>
          <MapView shipments={MOCK_SHIPMENTS} />
        </div>
      </div>
    </div>
  );
}
