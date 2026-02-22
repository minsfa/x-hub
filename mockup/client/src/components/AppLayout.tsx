/*
 * AppLayout — X-Hub Clean Technical Light
 * Dark sidebar (#1e293b) + Light content area
 * IBM Plex Sans throughout
 */
import { useApp } from '@/contexts/AppContext';
import { useLocation } from 'wouter';
import {
  LayoutDashboard, FolderOpen, FileText, Settings,
  ChevronRight, Bell, LogOut, RefreshCw, Shield, Wrench,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  projectId?: string;
  projectName?: string;
}

export default function AppLayout({ children, projectId, projectName }: AppLayoutProps) {
  const { currentUser, switchRole } = useApp();
  const [location, navigate] = useLocation();

  const isOwner = currentUser.role === 'OWNER';

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderOpen, label: 'Projects', path: '/', badge: null },
    { icon: FileText, label: 'Reports', path: '/', badge: isOwner ? '4' : null },
    { icon: Activity, label: 'Audit Log', path: '/' },
    { icon: Settings, label: 'Settings', path: '/' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--sidebar-primary)' }}>
              X
            </div>
            <span className="font-semibold text-sm tracking-wide" style={{ color: 'var(--sidebar-foreground)' }}>X-Hub</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'oklch(0.3 0.02 250)', color: 'oklch(0.6 0.1 264)' }}>v1</span>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="rounded-md p-2.5 flex items-center gap-2.5" style={{ background: 'var(--sidebar-accent)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: isOwner ? 'oklch(0.5 0.18 280)' : 'oklch(0.488 0.19 264)' }}>
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--sidebar-accent-foreground)' }}>{currentUser.name}</p>
              <p className="text-xs truncate" style={{ color: 'oklch(0.6 0.01 250)' }}>{currentUser.company}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { switchRole(); toast.success(`Switched to ${currentUser.role === 'MAKER' ? 'Owner' : 'Maker'} view`); }}
                  className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <RefreshCw size={13} style={{ color: 'oklch(0.65 0.01 250)' }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Switch Role</TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-1">
            {isOwner
              ? <><Shield size={11} style={{ color: 'oklch(0.6 0.15 280)' }} /><span className="text-xs" style={{ color: 'oklch(0.6 0.15 280)' }}>Owner View</span></>
              : <><Wrench size={11} style={{ color: 'oklch(0.6 0.15 264)' }} /><span className="text-xs" style={{ color: 'oklch(0.6 0.15 264)' }}>Maker View</span></>
            }
          </div>
        </div>

        {/* Breadcrumb if in project */}
        {projectId && projectName && (
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-xs hover:text-white transition-colors" style={{ color: 'oklch(0.55 0.01 250)' }}>
              <LayoutDashboard size={11} />
              <span>Dashboard</span>
            </button>
            <div className="flex items-center gap-1 mt-1">
              <ChevronRight size={11} style={{ color: 'oklch(0.45 0.01 250)' }} />
              <span className="text-xs font-medium truncate" style={{ color: 'oklch(0.75 0.01 250)' }}>{projectName}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path, badge }) => {
            const isActive = label === 'Dashboard' ? location === '/' : false;
            return (
              <button
                key={label}
                onClick={() => { if (label !== 'Dashboard') toast.info(`${label} — coming soon`); else navigate(path); }}
                className={cn('sidebar-item w-full', isActive && 'active')}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{label}</span>
                {badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-medium"
                    style={{ background: 'oklch(0.55 0.22 27 / 0.25)', color: 'oklch(0.7 0.18 27)' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button className="sidebar-item w-full" onClick={() => toast.info('Logout — coming soon')}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {projectName
              ? <><span className="text-foreground font-medium">{projectName}</span></>
              : <span className="text-foreground font-semibold">NDT Report Management</span>
            }
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => toast.info('Notifications — coming soon')}>
              <Bell size={16} />
              {isOwner && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              )}
            </Button>
            <div className="h-8 w-px bg-border" />
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              isOwner ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            )}>
              {isOwner ? <Shield size={11} /> : <Wrench size={11} />}
              {isOwner ? 'Owner' : 'Maker'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
