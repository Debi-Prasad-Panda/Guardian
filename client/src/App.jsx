import { Routes, Route, Navigate } from 'react';
import SiteLayout from './layouts/SiteLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';

// Site Pages
import Home from './pages/site/Home';

// Workspace Pages
import Overview from './pages/workspace/Overview';
import Shipments from './pages/workspace/Shipments';
import ChaosLab from './pages/workspace/ChaosLab';

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
        <Route path="overview" element={<Overview />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="chaos-lab" element={<ChaosLab />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
