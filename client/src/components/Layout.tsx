import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClipboardList,
  Cog,
  FolderKanban,
  LogOut,
  User,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
  projectInfo?: {
    name: string;
    customer: string;
  };
}

export default function Layout({ children, projectInfo }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const displayName = user?.name ?? user?.email ?? "User";
  const avatar = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 shrink-0">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-8">
          <span className="text-primary-foreground font-bold text-lg">X</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          <NavItem
            href="/"
            icon={<FolderKanban size={20} />}
            label="Projects"
            active={location === "/"}
          />
          <NavItem
            href="#"
            icon={<ClipboardList size={20} />}
            label="Reports"
            active={false}
            disabled
          />
          <NavItem
            href="#"
            icon={<Cog size={20} />}
            label="Settings"
            active={false}
            disabled
          />
        </nav>

        {/* User */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
            {avatar}
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="led-indicator led-success" />
            <span className="text-sm font-medium">NDT Inspection System</span>
          </div>

          {projectInfo && (
            <>
              <div className="mx-4 h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Project:</span>
                <span className="font-medium truncate max-w-[300px]">
                  {projectInfo.name}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{projectInfo.customer}</span>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-muted-foreground" />
              <span className="text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">({user?.role})</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
}

function NavItem({ href, icon, label, active, disabled }: NavItemProps) {
  const content = (
    <div
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
        active
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={label}
    >
      {icon}
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
