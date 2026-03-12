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
  ChevronDown,
} from 'lucide-react'

const NAV = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, text: 'Dashboard' },
      { to: '/shipments/SHP_001', icon: FileBarChart2, text: 'Health Wallet' }, // Modified text just to match vibes if wanted, but using original routes
      { to: '/ports', icon: Globe, text: 'Port Intelligence' },
    ],
  },
  {
    label: 'Features',
    items: [
      { to: '/chaos', icon: FlaskConical, text: 'Chaos Injector' },
      { to: '/network', icon: LineChart, text: 'Network Ripple' },
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
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-dash-accent rounded-lg flex items-center justify-center glow-teal">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-white font-bold text-lg tracking-tight">
              Guardian <span className="text-dash-accent text-xs">AI</span>
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto custom-scrollbar">
          {NAV.map((section) => (
            <div key={section.label}>
              <div className="flex items-center justify-between px-2 mb-3 cursor-pointer group">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">
                  {section.label}
                </p>
                <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              
              <ul className="relative space-y-0.5 ml-3 pb-2">
                {section.items.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === section.items.length - 1;
                  
                  return (
                    <li key={item.to} className="relative z-10 block">
                      {/* Vertical line passing through (only if not the last item) */}
                      {!isLast && (
                        <div className={`absolute left-0 w-px -z-10 bg-white/30 ${
                          isFirst ? '-top-2 bottom-0 bg-gradient-to-b from-transparent to-white/30' : '-top-0.5 bottom-0'
                        }`} />
                      )}
                      
                      {/* Curved connector tying the line to the menu item */}
                      <div className={`absolute left-0 w-3 border-l border-b border-white/30 rounded-bl-xl -z-10 ${
                        isFirst ? '-top-2 bottom-1/2 bg-gradient-to-b from-transparent to-white/0 border-t-0' : '-top-0.5 bottom-1/2'
                      }`} />
                      
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `ml-3 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-dash-accent/20 to-transparent text-white shadow-[inset_2px_0_0_0_rgba(0,242,255,0.8)]'
                              : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.02]'
                          }`
                        }
                      >
                        <item.icon className="w-4.5 h-4.5" />
                        <span className="text-[13px] font-semibold tracking-wide">{item.text}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Status Widget */}
        <div className="p-6">
          <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 space-y-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-dash-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-2 h-2 rounded-full bg-dash-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <p className="text-xs font-semibold text-white tracking-wide">AI Active</p>
            </div>
            <p className="text-[11px] text-gray-500 relative z-10">Listening to 1.18M inputs</p>
            <div className="h-1 bg-black/40 rounded-full overflow-hidden relative z-10 border border-white/5">
              <div className="h-full bg-dash-accent w-4/5 shadow-[0_0_8px_rgba(0,242,255,1)]" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

