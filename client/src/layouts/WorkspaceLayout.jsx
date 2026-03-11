import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Map, Package, Zap, BarChart2, Anchor, Settings, LogOut, Menu, Shield } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/workspace/overview' },
  { icon: Map, label: 'Risk Map', path: '/workspace/map' },
  { icon: Package, label: 'Shipments', path: '/workspace/shipments' },
  { icon: Zap, label: 'Chaos Lab', path: '/workspace/chaos-lab' },
  { icon: BarChart2, label: 'Analytics', path: '/workspace/analytics' },
  { icon: Anchor, label: 'Ports', path: '/workspace/ports' },
];

function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const pageTitle = navItems.find(n => location.pathname.startsWith(n.path))?.label
    ?? (location.pathname.includes('/settings') ? 'Settings' : 'Dashboard');

  return (
    <header className="h-14 flex items-center px-4 gap-3 shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm z-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Separator orientation="vertical" className="h-5 bg-border/50" />
      <nav className="flex items-center text-sm text-muted-foreground font-medium gap-1.5">
        <span className="text-muted-foreground/60">Workspace</span>
        <span className="text-border">/</span>
        <span className="text-foreground font-semibold">{pageTitle}</span>
      </nav>
    </header>
  );
}

export default function WorkspaceLayout() {
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-screen bg-background overflow-hidden">
        {/* Sidebar — variant="sidebar" pushes content, never overlaps */}
        <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r border-sidebar-border bg-sidebar shrink-0">
          <SidebarHeader className="h-14 flex flex-row items-center gap-2 px-5 border-b border-sidebar-border/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-black text-base tracking-widest text-primary uppercase">Guardian</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest px-3 mb-1 text-sidebar-foreground/40 font-bold">
                Modules
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className={`h-10 rounded-lg mb-0.5 font-medium transition-all duration-150 ${
                            isActive
                              ? 'bg-primary/15 text-primary hover:bg-primary/20'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5'
                          }`}
                        >
                          <Link to={item.path}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="text-[13px]">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/60 p-3 space-y-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Settings"
                  className="h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5 rounded-lg"
                >
                  <Link to="/workspace/settings">
                    <Settings className="w-4 h-4" />
                    <span className="text-[13px]">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center gap-3 px-2 py-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">OP</div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-xs font-semibold leading-tight text-sidebar-foreground truncate">Operator User</span>
                <button className="text-[11px] text-sidebar-foreground/50 hover:text-destructive flex items-center gap-1 mt-0.5 transition-colors w-fit">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main content — grows to fill remaining space */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


