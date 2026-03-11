import { Routes, Route, Navigate } from 'react-router';
import SiteLayout from './layouts/SiteLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';

// Site Pages
import Home from './pages/site/Home';

// Workspace Pages
import Overview       from './pages/workspace/Overview';
import Shipments      from './pages/workspace/Shipments';
import ShipmentDetail from './pages/workspace/ShipmentDetail';
import ChaosLab       from './pages/workspace/ChaosLab';
import RiskMap        from './pages/workspace/RiskMap';
import Analytics      from './pages/workspace/Analytics';
import Ports          from './pages/workspace/Ports';
import Settings       from './pages/workspace/Settings';

function App() {
  return (
    <Routes>
      {/* Landing Site */}
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Workspace App */}
      <Route path="/workspace" element={<WorkspaceLayout />}>
        <Route index element={<Navigate to="/workspace/overview" replace />} />
        <Route path="overview"           element={<Overview />} />
        <Route path="map"                element={<RiskMap />} />
        <Route path="shipments"          element={<Shipments />} />
        <Route path="shipments/:id"      element={<ShipmentDetail />} />
        <Route path="chaos-lab"          element={<ChaosLab />} />
        <Route path="analytics"          element={<Analytics />} />
        <Route path="ports"              element={<Ports />} />
        <Route path="settings"           element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

