/*
 * Dashboard — X-Hub Clean Technical Light
 * Maker view: project list + upload CTA
 * Owner view: approval summary + pending reports
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import AppLayout from '@/components/AppLayout';
import { projects, getReportsByProjectId, type Project } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Clock, XCircle, FolderOpen, Upload,
  Search, ChevronRight, BarChart3, FileText, AlertTriangle,
  TrendingUp, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: Project['status'] }) {
  const map = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Hold: 'bg-amber-50 text-amber-700 border-amber-200',
    Done: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', map[status])}>
      {status}
    </span>
  );
}

function ApprovalDot({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const map = {
    PENDING: 'bg-amber-400',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
  };
  return <span className={cn('inline-block w-2 h-2 rounded-full', map[status])} />;
}

export default function Dashboard() {
  const { currentUser } = useApp();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const isOwner = currentUser.role === 'OWNER';

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalReports = projects.reduce((s, p) => s + p.totalReports, 0);
  const totalApproved = projects.reduce((s, p) => s + p.approvedReports, 0);
  const totalPending = projects.reduce((s, p) => s + p.pendingReports, 0);
  const totalRejected = projects.reduce((s, p) => s + p.rejectedReports, 0);

  // All pending reports for owner view
  const allReports = projects.flatMap(p => getReportsByProjectId(p.id));
  const pendingReports = allReports.filter(r => r.ownerApprovalStatus === 'PENDING');

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isOwner ? 'Quality Dossier Overview' : 'Project Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isOwner
                ? 'Review and approve NDT inspection reports submitted by manufacturers.'
                : 'Manage NDT inspection reports and track approval status.'}
            </p>
          </div>
          {!isOwner && (
            <Button onClick={() => toast.info('Upload Report — coming in full version')} className="gap-2">
              <Upload size={15} />
              Upload Report
            </Button>
          )}
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: totalReports, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Approved', value: totalApproved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending Review', value: totalPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Rejected', value: totalRejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                    <p className={cn('text-2xl font-bold mt-1 font-mono', color)}>{value}</p>
                  </div>
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bg)}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Owner: Pending Approvals ── */}
        {isOwner && pendingReports.length > 0 && (
          <Card className="border shadow-sm border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={15} className="text-amber-600" />
                  Pending Your Approval ({pendingReports.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-2">
                {pendingReports.slice(0, 4).map(r => (
                  <div key={r.id}
                    className="flex items-center justify-between bg-white rounded-md px-3 py-2.5 border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                    onClick={() => navigate(`/workspace/${r.projectId}`)}>
                    <div className="flex items-center gap-3">
                      <ApprovalDot status="PENDING" />
                      <div>
                        <p className="text-sm font-medium font-mono">{r.reportNo}</p>
                        <p className="text-xs text-muted-foreground">{r.itemNumber} · {r.reportType} · {r.inspectionCompanyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.issuedDate}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Projects ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <div className="relative w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map(project => {
              const completionPct = project.totalReports > 0
                ? Math.round((project.approvedReports / project.totalReports) * 100)
                : 0;
              return (
                <Card key={project.id}
                  className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/workspace/${project.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <FolderOpen size={18} className="text-blue-600" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
                          <StatusBadge status={project.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Owner: <span className="font-medium">{project.ownerName}</span>
                          <span className="mx-1.5">·</span>
                          {project.procedureCode.slice(0, 40)}…
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="w-36 flex-shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Approval</span>
                          <span className="text-xs font-mono font-semibold text-foreground">{completionPct}%</span>
                        </div>
                        <Progress value={completionPct} className="h-1.5" />
                      </div>

                      {/* Report counts */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xs font-mono font-bold text-emerald-600">{project.approvedReports}</p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-mono font-bold text-amber-600">{project.pendingReports}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-mono font-bold text-red-600">{project.rejectedReports}</p>
                          <p className="text-xs text-muted-foreground">Rejected</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-mono font-bold text-foreground">{project.totalReports}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>

                      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
