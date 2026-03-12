import { Routes, Route } from 'react-router'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import ShipmentDetail from './pages/ShipmentDetail'
import ChaosInjector from './pages/ChaosInjector'
import PortCongestion from './pages/PortCongestion'
import NetworkRipple from './pages/NetworkRipple'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ModelCard from './pages/ModelCard'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/shipments/:id" element={<ShipmentDetail />} />
        <Route path="/chaos" element={<ChaosInjector />} />
        <Route path="/ports" element={<PortCongestion />} />
        <Route path="/network" element={<NetworkRipple />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/model-card" element={<ModelCard />} />
      </Route>
    </Routes>
  )
}

