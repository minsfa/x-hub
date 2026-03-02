/**
 * Workspace 우측: Report 상세 (Attachments, RT Studies, Approval)
 */

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink, FileText } from "lucide-react";
import ApprovalControls from "./ApprovalControls";
import PdfViewer from "./PdfViewer";

interface RtResultRow {
  id: string;
  identificationNo: string;
  locationNo: string;
  result: string;
  defect: string | null;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface ReportDetailData {
  id: string;
  reportNo: string;
  reportType: string;
  issuedDate: string;
  ownerApprovalStatus: string;
  pdfUrl?: string;
  tags: Record<string, string> | null;
  item: { id: string; name: string; number: string };
  attachments?: Attachment[];
  rtResultRows: RtResultRow[];
}

interface ReportDetailPanelProps {
  report: ReportDetailData | null;
  isLoading: boolean;
}

export default function ReportDetailPanel({ report, isLoading }: ReportDetailPanelProps) {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-full flex flex-col bg-background items-center justify-center p-6">
        <p className="text-muted-foreground">Select a report</p>
      </div>
    );
  }

  const studies = (() => {
    const byId = new Map<string, { hasRej: boolean }>();
    for (const row of report.rtResultRows) {
      const key = row.identificationNo;
      if (!byId.has(key)) {
        byId.set(key, { hasRej: false });
      }
      const g = byId.get(key)!;
      if (row.result === "REJ") g.hasRej = true;
    }
    return Array.from(byId.entries()).map(([identificationNo, g]) => ({
      id: identificationNo,
      identificationNo,
      status: g.hasRej ? "REJ" : "ACC",
    }));
  })();

  const handleOpenViewer = () => {
    const viewerUrl = `https://x-hub.inforad.co.kr/viewer/?studyid=1.2.724.33963612.20260201.16140473751755530199`;
    window.open(viewerUrl, "_blank", "width=1200,height=800");
  };

  const issuedDate =
    typeof report.issuedDate === "string"
      ? report.issuedDate.slice(0, 10)
      : new Date(report.issuedDate).toISOString().slice(0, 10);

  const pdfUrl = report.pdfUrl ?? report.attachments?.[0]?.fileUrl ?? "";
  const isRt = report.reportType === "RT";

  return (
    <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1 shrink-0">
        <div className="p-6 space-y-6">
          {/* Report 기본 정보 */}
          <section>
            <h3 className="font-semibold mb-2">Report</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">No:</span>{" "}
                <span className="font-mono-data">{report.reportNo}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Type:</span> {report.reportType}
              </p>
              <p>
                <span className="text-muted-foreground">Item:</span> {report.item.name} (
                {report.item.number})
              </p>
              <p>
                <span className="text-muted-foreground">Issued:</span> {issuedDate}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span
                  className={cn(
                    "status-badge",
                    report.ownerApprovalStatus === "PENDING" && "status-pending",
                    report.ownerApprovalStatus === "APPROVED" && "status-active",
                    report.ownerApprovalStatus === "REJECTED" && "status-rej"
                  )}
                >
                  {report.ownerApprovalStatus}
                </span>
              </p>
            </div>
          </section>

          {/* Attachments */}
          <section>
            <h3 className="font-semibold mb-2">Attachments</h3>
            {(report.attachments?.length ?? 0) > 0 ? (
              <ul className="space-y-2">
                {(report.attachments ?? []).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-muted-foreground" />
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {a.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </section>

          {/* PDF 뷰어 (RT가 아닐 때: MT, UT, OTHER 등) */}
          {!isRt && pdfUrl && (
            <section>
              <h3 className="font-semibold mb-2">Report PDF</h3>
              <PdfViewer url={pdfUrl} className="min-h-[400px]" />
            </section>
          )}

          {/* RT Studies (RT 타입일 때만) */}
          {isRt && report.rtResultRows?.length > 0 && (
            <section>
              <h3 className="font-semibold mb-2">RT Studies</h3>
              <div className="space-y-1 mb-3">
                {studies.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-mono-data">{s.identificationNo}</span>
                    <span
                      className={cn(
                        "status-badge text-xs",
                        s.status === "ACC" && "status-acc",
                        s.status === "REJ" && "status-rej"
                      )}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={handleOpenViewer} size="sm" className="gap-2">
                <ExternalLink size={14} />
                Open x-view
              </Button>
            </section>
          )}

          {/* Owner Approval (Owner만) */}
          {isOwner && report.ownerApprovalStatus === "PENDING" && (
            <ApprovalControls reportId={report.id} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
