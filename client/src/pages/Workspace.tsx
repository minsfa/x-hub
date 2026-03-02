import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchProject,
  fetchReport,
  fetchReportsByProject,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ReportListItem } from "@shared/types";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

// RtResultRow 기반 Study (identificationNo로 그룹)
interface Study {
  id: string;
  identificationNo: string;
  status: "ACC" | "REJ";
}

// RtResultRow = Image
interface ImageData {
  id: string;
  studyId: string;
  locationNo: string;
  result: "ACC" | "REJ";
  defect: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
}

export default function Workspace() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", projectId],
    queryFn: () => fetchReportsByProject(projectId),
    enabled: !!projectId,
  });

  const { data: reportDetail } = useQuery({
    queryKey: ["report", selectedReportId],
    queryFn: () => fetchReport(selectedReportId!),
    enabled: !!selectedReportId,
  });

  // Studies: rtResultRows를 identificationNo로 그룹
  const studies: Study[] = reportDetail?.rtResultRows
    ? (() => {
        const byId = new Map<string, { ids: string[]; hasRej: boolean }>();
        for (const row of reportDetail.rtResultRows) {
          const key = row.identificationNo;
          if (!byId.has(key)) {
            byId.set(key, { ids: [], hasRej: false });
          }
          const g = byId.get(key)!;
          g.ids.push(row.id);
          if (row.result === "REJ") g.hasRej = true;
        }
        return Array.from(byId.entries()).map(([identificationNo, g]) => ({
          id: identificationNo,
          identificationNo,
          status: (g.hasRej ? "REJ" : "ACC") as "ACC" | "REJ",
        }));
      })()
    : [];

  // Images: 선택된 study의 rtResultRows
  const images: ImageData[] =
    reportDetail?.rtResultRows && selectedStudyId
      ? reportDetail.rtResultRows
          .filter((r) => r.identificationNo === selectedStudyId)
          .map((r) => ({
            id: r.id,
            studyId: selectedStudyId,
            locationNo: r.locationNo,
            result: r.result as "ACC" | "REJ",
            defect: r.defect ?? "None",
            approvalStatus:
              reportDetail.ownerApprovalStatus === "PENDING"
                ? "Pending"
                : reportDetail.ownerApprovalStatus === "APPROVED"
                  ? "Approved"
                  : "Rejected",
          }))
      : [];

  const filteredReports = reports.filter(
    (r) =>
      r.reportNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedReport = selectedReportId
    ? reports.find((r) => r.id === selectedReportId)
    : null;

  const selectedStudy = selectedStudyId
    ? studies.find((s) => s.id === selectedStudyId)
    : null;

  const handleOpenViewer = () => {
    const viewerUrl = `https://x-hub.inforad.co.kr/viewer/?studyid=1.2.724.33963612.20260201.16140473751755530199`;
    window.open(viewerUrl, "_blank", "width=1200,height=800");
  };

  if (!projectId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </Layout>
    );
  }

  if (projectLoading || projectError) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          {projectLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <p className="text-destructive">Failed to load project</p>
          )}
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      projectInfo={{
        name: project.name,
        customer: project.owner.name,
      }}
    >
      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* Pane 1: Report List */}
        <div className="w-1/4 min-w-[280px] border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
                  <ArrowLeft size={16} />
                  Back
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Reports</h2>
              <span className="text-xs text-muted-foreground">
                Total: {reports.length}
              </span>
            </div>
            <div className="relative mt-3">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search Report No..."
                className="pl-8 h-8 text-sm bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {reportsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : (
                filteredReports.map((report) => (
                  <ReportListItem
                    key={report.id}
                    report={report}
                    isSelected={selectedReportId === report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      setSelectedStudyId(null);
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Pane 2: Study List */}
        <div className="w-1/5 min-w-[200px] border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Joints / Studies</h2>
            {selectedReport && (
              <p className="text-xs text-muted-foreground mt-1">
                Ref: {selectedReport.reportNo}
              </p>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {selectedReportId ? (
                studies.length > 0 ? (
                  studies.map((study) => (
                    <StudyListItem
                      key={study.id}
                      study={study}
                      isSelected={selectedStudyId === study.id}
                      onClick={() => setSelectedStudyId(study.id)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No studies found
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a report
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Pane 3: Image List */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Film Strip & Tags</h2>
              {selectedStudy && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {selectedStudy.identificationNo}
                </p>
              )}
            </div>
            {selectedStudyId && images.length > 0 && (
              <Button onClick={handleOpenViewer} className="gap-2">
                <ExternalLink size={16} />
                Open Viewer
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            {selectedStudyId ? (
              images.length > 0 ? (
                <ImageTable images={images} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No images found</p>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a study to view images</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}

function ReportListItem({
  report,
  isSelected,
  onClick,
}: {
  report: ReportListItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isPending = report.status === "Pending";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg mb-1 transition-all",
        "border-l-2",
        isSelected
          ? "bg-primary/10 border-l-primary"
          : isPending
            ? "bg-transparent border-l-alert/50 hover:bg-secondary/50"
            : "bg-transparent border-l-success/50 hover:bg-secondary/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{report.reportNo}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {report.itemName}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-muted-foreground font-mono-data">
            {report.date}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
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
}

function StudyListItem({
  study,
  isSelected,
  onClick,
}: {
  study: Study;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg mb-1 transition-all",
        isSelected ? "bg-primary/10" : "hover:bg-secondary/50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm font-mono-data">
          {study.identificationNo}
        </span>
        <span
          className={cn(
            "status-badge",
            study.status === "ACC" && "status-acc",
            study.status === "REJ" && "status-rej"
          )}
        >
          {study.status}
        </span>
      </div>
    </button>
  );
}

function ImageTable({ images }: { images: ImageData[] }) {
  const handleApprove = (imageId: string) => {
    toast.success("Image approved successfully");
  };

  const handleReject = (imageId: string) => {
    toast.error("Image rejected");
  };

  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-card z-10">
        <tr className="border-b border-border">
          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Loc No
          </th>
          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Result
          </th>
          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Defect
          </th>
          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Approval
          </th>
          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {images.map((image) => (
          <tr
            key={image.id}
            className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
          >
            <td className="p-3 font-mono-data text-sm">{image.locationNo}</td>
            <td className="p-3">
              <span
                className={cn(
                  "status-badge",
                  image.result === "ACC" && "status-acc",
                  image.result === "REJ" && "status-rej"
                )}
              >
                {image.result}
              </span>
            </td>
            <td className="p-3 text-sm">
              {image.defect === "None" ? (
                <span className="text-muted-foreground">-</span>
              ) : (
                <span className="font-medium text-warning">{image.defect}</span>
              )}
            </td>
            <td className="p-3">
              <span
                className={cn(
                  "status-badge",
                  image.approvalStatus === "Approved" && "status-active",
                  image.approvalStatus === "Rejected" && "status-rej",
                  image.approvalStatus === "Pending" && "status-pending"
                )}
              >
                {image.approvalStatus}
              </span>
            </td>
            <td className="p-3">
              {image.approvalStatus === "Pending" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-success hover:text-success hover:bg-success/10"
                    onClick={() => handleApprove(image.id)}
                  >
                    <CheckCircle2 size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-alert hover:text-alert hover:bg-alert/10"
                    onClick={() => handleReject(image.id)}
                  >
                    <XCircle size={16} />
                  </Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
