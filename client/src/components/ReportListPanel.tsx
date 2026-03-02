/**
 * Workspace 중앙: 선택된 Item의 Report 목록
 */

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NdtReportListItem } from "@shared/types";
import { Plus } from "lucide-react";

interface ReportListPanelProps {
  reports: NdtReportListItem[];
  selectedReportId: string | null;
  onSelectReport: (reportId: string) => void;
  canCreate?: boolean;
  onNewReport?: () => void;
}

export default function ReportListPanel({
  reports,
  selectedReportId,
  onSelectReport,
  canCreate,
  onNewReport,
}: ReportListPanelProps) {
  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Reports</h2>
            <span className="text-xs text-muted-foreground">Total: {reports.length}</span>
          </div>
          {canCreate && onNewReport && (
            <Button size="sm" variant="outline" onClick={onNewReport} className="gap-1.5">
              <Plus size={14} />
              New
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select an item
            </p>
          ) : (
            reports.map((report) => {
              const isPending = report.status === "PENDING";
              return (
                <button
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg mb-1 transition-all",
                    "border-l-2",
                    selectedReportId === report.id
                      ? "bg-primary/10 border-l-primary"
                      : isPending
                        ? "bg-transparent border-l-alert/50 hover:bg-secondary/50"
                        : "bg-transparent border-l-success/50 hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm font-mono-data">
                        {report.reportNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {report.ndtType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={cn(
                        "led-indicator",
                        isPending ? "led-alert" : "led-success"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs",
                        isPending ? "text-alert" : "text-success"
                      )}
                    >
                      {report.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
