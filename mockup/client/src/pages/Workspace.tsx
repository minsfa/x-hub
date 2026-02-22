/*
 * Workspace — X-Hub Clean Technical Light
 * 3-Pane layout: Item Tree | Report List | Report Detail / RT Viewer
 * RT reports: show structured result rows
 * OTHER reports: show PDF viewer placeholder + approval controls
 */
import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import AppLayout from '@/components/AppLayout';
import {
  getProjectById, getItemsByProjectId, getReportsByItemId,
  getReportById, type Item, type Report, type RtResultRow
} from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2, XCircle, Clock, FileText, ChevronRight,
  Eye, Upload, Download, MessageSquare, Shield, Wrench,
  AlertCircle, ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Status helpers ────────────────────────────────────────────────────────────
function ApprovalBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  if (status === 'APPROVED') return (
    <span className="badge-approved inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium">
      <CheckCircle2 size={11} /> Approved
    </span>
  );
  if (status === 'REJECTED') return (
    <span className="badge-rejected inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium">
      <XCircle size={11} /> Rejected
    </span>
  );
  return (
    <span className="badge-pending inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium">
      <Clock size={11} /> Pending
    </span>
  );
}

function ReportTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    RT: 'bg-blue-100 text-blue-700',
    MT: 'bg-purple-100 text-purple-700',
    UT: 'bg-cyan-100 text-cyan-700',
    HT: 'bg-orange-100 text-orange-700',
    PMI: 'bg-teal-100 text-teal-700',
    OTHER: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded font-mono font-semibold', colors[type] || colors.OTHER)}>
      {type}
    </span>
  );
}

function TestPhaseBadge({ phase }: { phase: string }) {
  if (phase === 'NA') return null;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
      {phase === 'AFTER_PWHT' ? 'After PWHT' : 'Before PWHT'}
    </span>
  );
}

// ── RT Result Table ───────────────────────────────────────────────────────────
function RtResultTable({ rows }: { rows: RtResultRow[] }) {
  const grouped = rows.reduce<Record<string, RtResultRow[]>>((acc, row) => {
    if (!acc[row.identificationNo]) acc[row.identificationNo] = [];
    acc[row.identificationNo].push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([identNo, groupRows]) => (
        <div key={identNo} className="border border-border rounded-md overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 flex items-center justify-between border-b border-border">
            <span className="text-xs font-semibold font-mono text-foreground">{identNo}</span>
            <span className="text-xs text-muted-foreground">{groupRows.length} locations</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Result</th>
                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Defect</th>
              </tr>
            </thead>
            <tbody>
              {groupRows.map(row => (
                <tr key={row.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-mono">{row.locationNo}</td>
                  <td className="px-3 py-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 font-mono font-semibold text-xs',
                      row.result === 'ACC' ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {row.result === 'ACC'
                        ? <CheckCircle2 size={11} />
                        : <XCircle size={11} />}
                      {row.result}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono">
                    {row.defect === 'None' ? '—' : row.defect}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ── PDF Viewer Placeholder ────────────────────────────────────────────────────
function PdfViewerPlaceholder({ reportNo }: { reportNo: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-lg mx-4 my-4 gap-3">
      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
        <FileText size={28} className="text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600 font-mono">{reportNo}</p>
        <p className="text-xs text-slate-400 mt-1">PDF Viewer</p>
        <p className="text-xs text-slate-400">Mozilla PDF.js will render here</p>
      </div>
      <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={() => toast.info('PDF viewer — available in full version')}>
        <Eye size={13} />
        Open PDF
      </Button>
    </div>
  );
}

// ── Approval Controls ─────────────────────────────────────────────────────────
function ApprovalControls({
  report,
  onApprove,
  onReject,
}: {
  report: Report;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
}) {
  const [comment, setComment] = useState(report.ownerComment || '');
  const { currentUser } = useApp();
  const isOwner = currentUser.role === 'OWNER';

  if (!isOwner) {
    return (
      <div className="border-t border-border p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wrench size={12} />
          <span>Approval controls are visible to Owner role only.</span>
        </div>
        {report.ownerApprovalStatus !== 'PENDING' && (
          <div className="mt-2 p-3 rounded-md bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ApprovalBadge status={report.ownerApprovalStatus} />
              <span className="text-xs text-muted-foreground">by {report.ownerApprovedBy} · {report.ownerApprovedAt}</span>
            </div>
            {report.ownerComment && (
              <p className="text-xs text-foreground mt-1 italic">"{report.ownerComment}"</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (report.ownerApprovalStatus !== 'PENDING') {
    return (
      <div className="border-t border-border p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Owner Decision</span>
        </div>
        <div className="p-3 rounded-md border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <ApprovalBadge status={report.ownerApprovalStatus} />
            <span className="text-xs text-muted-foreground">by {report.ownerApprovedBy} · {report.ownerApprovedAt}</span>
          </div>
          {report.ownerComment && (
            <p className="text-xs text-foreground mt-1 italic">"{report.ownerComment}"</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border px-4 py-3 bg-card flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={12} className="text-primary" />
        <span className="text-xs font-semibold text-foreground">Owner Approval</span>
        <span className="badge-pending text-xs px-2 py-0.5 rounded-full">Awaiting your review</span>
      </div>
      <div className="flex gap-2 items-start">
        <Textarea
          placeholder="Add a comment (optional)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="text-xs h-10 resize-none flex-1"
        />
        <Button
          size="sm"
          className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-3 flex-shrink-0"
          onClick={() => onApprove(comment)}
        >
          <CheckCircle2 size={13} />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 border-red-200 text-red-600 hover:bg-red-50 h-10 px-3 flex-shrink-0"
          onClick={() => onReject(comment)}
        >
          <XCircle size={13} />
          Reject
        </Button>
      </div>
    </div>
  );
}

// ── Main Workspace ────────────────────────────────────────────────────────────
export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useApp();
  const isOwner = currentUser.role === 'OWNER';

  const project = getProjectById(projectId || '');
  const itemList = getItemsByProjectId(projectId || '');

  const [selectedItem, setSelectedItem] = useState<Item | null>(itemList[0] || null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportStatuses, setReportStatuses] = useState<Record<string, { status: 'PENDING' | 'APPROVED' | 'REJECTED'; comment?: string; by?: string; at?: string }>>({});

  const reports = selectedItem ? getReportsByItemId(selectedItem.id) : [];

  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [selectedItem]);

  const getEffectiveStatus = (report: Report): 'PENDING' | 'APPROVED' | 'REJECTED' => {
    return reportStatuses[report.id]?.status ?? report.ownerApprovalStatus;
  };

  const handleApprove = (comment: string) => {
    if (!selectedReport) return;
    setReportStatuses(prev => ({
      ...prev,
      [selectedReport.id]: { status: 'APPROVED', comment, by: currentUser.name, at: new Date().toISOString().slice(0, 10) }
    }));
    toast.success(`Report ${selectedReport.reportNo} approved.`);
  };

  const handleReject = (comment: string) => {
    if (!selectedReport) return;
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setReportStatuses(prev => ({
      ...prev,
      [selectedReport.id]: { status: 'REJECTED', comment, by: currentUser.name, at: new Date().toISOString().slice(0, 10) }
    }));
    toast.error(`Report ${selectedReport.reportNo} rejected.`);
  };

  if (!project) return <AppLayout><div className="p-8 text-muted-foreground">Project not found.</div></AppLayout>;

  const effectiveReport = selectedReport
    ? {
        ...selectedReport,
        ownerApprovalStatus: getEffectiveStatus(selectedReport),
        ownerComment: reportStatuses[selectedReport.id]?.comment ?? selectedReport.ownerComment,
        ownerApprovedBy: reportStatuses[selectedReport.id]?.by ?? selectedReport.ownerApprovedBy,
        ownerApprovedAt: reportStatuses[selectedReport.id]?.at ?? selectedReport.ownerApprovedAt,
      }
    : null;

  return (
    <AppLayout projectId={project.id} projectName={project.name}>
      <div className="flex h-full overflow-hidden">

        {/* ── Pane 1: Item Tree ── */}
        <div className="w-52 flex-shrink-0 pane-panel">
          <div className="pane-header">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Items</span>
            <span className="text-xs text-muted-foreground font-mono">{itemList.length}</span>
          </div>
          <ScrollArea className="flex-1">
            {itemList.map(item => {
              const itemReports = getReportsByItemId(item.id);
              const pendingCount = itemReports.filter(r => getEffectiveStatus(r) === 'PENDING').length;
              return (
                <div
                  key={item.id}
                  className={cn('pane-item', selectedItem?.id === item.id && 'selected')}
                  onClick={() => { setSelectedItem(item); setSelectedReport(itemReports[0] || null); }}
                >
                  <div className="flex items-start gap-2">
                    <Package size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-foreground truncate">{item.number}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground">{itemReports.length} reports</span>
                        {pendingCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{pendingCount} pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>

        {/* ── Pane 2: Report List ── */}
        <div className="w-64 flex-shrink-0 pane-panel">
          <div className="pane-header">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Reports</span>
            <span className="text-xs text-muted-foreground font-mono">{reports.length}</span>
          </div>
          <ScrollArea className="flex-1">
            {reports.map(report => {
              const status = getEffectiveStatus(report);
              return (
                <div
                  key={report.id}
                  className={cn('pane-item', selectedReport?.id === report.id && 'selected')}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ReportTypeBadge type={report.reportType} />
                        <TestPhaseBadge phase={report.testPhase} />
                      </div>
                      <p className="font-mono text-xs font-semibold text-foreground truncate">{report.reportNo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{report.inspectionCompanyName}</p>
                      <p className="text-xs text-muted-foreground">{report.issuedDate}</p>
                    </div>
                    <ApprovalBadge status={status} />
                  </div>
                </div>
              );
            })}
            {reports.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">No reports for this item.</div>
            )}
          </ScrollArea>
          {!isOwner && (
            <div className="p-3 border-t border-border">
              <Button size="sm" variant="outline" className="w-full gap-2 text-xs"
                onClick={() => toast.info('Upload Report — available in full version')}>
                <Upload size={12} />
                Upload Report
              </Button>
            </div>
          )}
        </div>

        {/* ── Pane 3: Report Detail ── */}
        <div className="flex-1 flex flex-col bg-card" style={{overflow:'hidden', height:'100%'}}>
          {effectiveReport ? (
            <>
              {/* Report header */}
              <div className="px-5 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ReportTypeBadge type={effectiveReport.reportType} />
                      <TestPhaseBadge phase={effectiveReport.testPhase} />
                      <ApprovalBadge status={effectiveReport.ownerApprovalStatus} />
                    </div>
                    <h2 className="text-base font-semibold font-mono text-foreground">{effectiveReport.reportNo}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {effectiveReport.itemNumber} · {effectiveReport.inspectionCompanyName} · {effectiveReport.issuedDate}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                      onClick={() => toast.info('Download — available in full version')}>
                      <Download size={13} />
                      Download PDF
                    </Button>
                    {isOwner && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                        onClick={() => toast.info('X-View — available in full version')}>
                        <Eye size={13} />
                        X-View
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {effectiveReport.tags && (
                  <div className="flex flex-wrap gap-3 mt-2.5">
                    {effectiveReport.tags.drawingNo && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Drawing: </span>
                        <span className="font-mono text-foreground">{effectiveReport.tags.drawingNo}</span>
                      </div>
                    )}
                    {effectiveReport.tags.inspector && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Inspector: </span>
                        <span className="font-medium text-foreground">{effectiveReport.tags.inspector}</span>
                      </div>
                    )}
                    {effectiveReport.tags.procedure && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Procedure: </span>
                        <span className="font-mono text-foreground">{effectiveReport.tags.procedure}</span>
                      </div>
                    )}
                    {effectiveReport.tags.technique && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Technique: </span>
                        <span className="font-medium text-foreground">{effectiveReport.tags.technique}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Report body */}
              <ScrollArea className="flex-1">
                {effectiveReport.reportType === 'RT' && effectiveReport.rtResultRows ? (
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">RT Examination Results</h3>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 size={11} />
                          {effectiveReport.rtResultRows.filter(r => r.result === 'ACC').length} ACC
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle size={11} />
                          {effectiveReport.rtResultRows.filter(r => r.result === 'REJ').length} REJ
                        </span>
                      </div>
                    </div>
                    <RtResultTable rows={effectiveReport.rtResultRows} />
                  </div>
                ) : (
                  <PdfViewerPlaceholder reportNo={effectiveReport.reportNo} />
                )}
              </ScrollArea>

              {/* Approval controls */}
              <ApprovalControls
                report={effectiveReport}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText size={32} className="text-muted-foreground/40" />
              <p className="text-sm">Select a report to view details</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
