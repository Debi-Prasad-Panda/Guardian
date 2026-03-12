import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  FileBarChart2,
  Globe,
  FlaskConical,
  LineChart,
  BarChart3,
  Settings,
  Archive,
  Zap,
} from 'lucide-react'

const NAV = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, text: 'Dashboard' },
      { to: '/shipments/SHP_001', icon: FileBarChart2, text: 'Shipment Details' },
      { to: '/ports', icon: Globe, text: 'Port Intelligence' },
    ],
  },
  {
    label: 'Features',
    items: [
      { to: '/chaos', icon: FlaskConical, text: 'Chaos Injector' },
      { to: '/network', icon: LineChart, text: 'Network Ripple Graph' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/analytics', icon: BarChart3, text: 'Analytics' },
      { to: '/settings', icon: Settings, text: 'Settings' },
      { to: '/model-card', icon: Archive, text: 'Model Card' },
    ],
  },
]

export default function Sidebar({ isOpen = true }) {
  return (
    <aside className={`bg-dash-sidebar border-r border-dash-border flex flex-col shrink-0 transition-all duration-300 overflow-hidden ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0'}`}>
      <div className="w-64 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-dash-accent rounded-lg flex items-center justify-center glow-teal">
          <Zap className="w-5 h-5 text-black" />
        </div>
        <h1 className="text-white font-bold text-lg tracking-tight">
          Innovate X <span className="text-dash-accent text-xs">5.0</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">
        {NAV.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md group transition-colors ${
                        isActive
                          ? 'bg-dash-accent/10 text-dash-accent border-l-2 border-dash-accent rounded-r-md rounded-l-none'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Status Widget */}
      <div className="p-4 border-t border-dash-border">
        <div className="glass-card p-4 rounded-xl space-y-2 border border-dash-accent/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-dash-green animate-pulse" />
            <p className="text-xs font-semibold text-white">Model Calibrated</p>
          </div>
          <p className="text-[11px] text-gray-400">1.18M Rows Active</p>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-dash-accent w-4/5" />
          </div>
        </div>
      </div>
      </div>
    </aside>
  )
}

