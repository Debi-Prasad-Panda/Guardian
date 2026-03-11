import MapView from '../../components/workspace/MapView';

const MOCK_SHIPMENTS = [
  { id: 'SHP_001', route: 'Bangalore → Delhi', tier: 'CRITICAL', risk_score: 87, longitude: 77.2090, latitude: 28.6139 }, 
  { id: 'SHP_047', route: 'Mumbai → Chennai', tier: 'PRIORITY', risk_score: 52, longitude: 80.2707, latitude: 13.0827 }, 
  { id: 'SHP_093', route: 'Delhi → Kolkata', tier: 'STANDARD', risk_score: 18, longitude: 88.3639, latitude: 22.5726 }, 
  { id: 'SHP_112', route: 'Chennai → Pune', tier: 'CRITICAL', risk_score: 92, longitude: 73.8567, latitude: 18.5204 }, 
  { id: 'SHP_214', route: 'Kolkata → Mumbai', tier: 'WARNING', risk_score: 65, longitude: 72.8777, latitude: 19.0760 }, 
];

export default function RiskMap() {
  return (
    <div className="page-container flex-col h-full gap-4">
      <div className="topbar flex justify-between items-center pb-4 border-b border-light">
        <h2 className="text-body text-secondary">Guardian &gt; Risk Map</h2>
      </div>
      <div className="card fill-remaining p-0 overflow-hidden relative" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <MapView shipments={MOCK_SHIPMENTS} />
      </div>
    </div>
  );
}
