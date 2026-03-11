import { Outlet, Link } from 'react-router';
import '../styles/site.css';

export default function SiteLayout() {
  return (
    <div className="site-layout min-h-screen bg-primary">
      <nav className="site-nav flex justify-between items-center py-4 px-8 border-b border-light">
        <div className="logo flex items-center gap-2">
          <span className="text-h3 font-bold text-primary">GUARDIAN</span>
        </div>
        <div className="flex gap-4">
          <Link to="/workspace" className="btn btn-primary text-sm font-semibold">
            Launch Workspace →
          </Link>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
