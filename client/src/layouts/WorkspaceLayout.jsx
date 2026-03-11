import { Outlet, Link, useLocation } from 'react';
import { LayoutDashboard, Map, Package, Zap, BarChart2, Anchor, Settings, LogOut } from 'lucide-react';
import '../styles/workspace.css';

export default function WorkspaceLayout() {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/workspace/overview' },
    { icon: Map, label: 'Risk Map', path: '/workspace/map' },
    { icon: Package, label: 'Shipments', path: '/workspace/shipments' },
    { icon: Zap, label: 'Chaos Lab', path: '/workspace/chaos-lab' },
    { icon: BarChart2, label: 'Analytics', path: '/workspace/analytics' },
    { icon: Anchor, label: 'Ports', path: '/workspace/ports' },
  ];

  return (
    <div className="workspace-layout">
      <aside className="sidebar flex-col">
        <div className="sidebar-header flex items-center gap-2">
          <span className="text-h3 font-bold">GUARDIAN</span>
        </div>
        
        <nav className="sidebar-nav flex-col">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const activeClass = isActive ? 'nav-item-active' : '';
            return (
              <Link key={item.path} to={item.path} className={`nav-item flex items-center gap-4 ${activeClass}`}>
                <item.icon size={18} className={isActive ? 'text-accent' : 'text-secondary'} />
                <span className={isActive ? 'text-primary' : 'text-secondary'}>{item.label}</span>
              </Link>
            )
          })}
          <div className="nav-divider"></div>
          <Link to="/workspace/settings" className="nav-item flex items-center gap-4">
            <Settings size={18} className="text-secondary" />
            <span className="text-secondary">Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer flex items-center gap-4">
          <div className="avatar">O</div>
          <div className="user-info flex-col">
            <span className="text-sm">Operator</span>
            <span className="text-xs text-secondary flex items-center gap-1"><LogOut size={12}/> Logout</span>
          </div>
        </div>
      </aside>
      
      <main className="workspace-content">
        <Outlet />
      </main>
    </div>
  );
}
