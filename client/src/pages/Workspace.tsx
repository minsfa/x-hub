/**
 * Workspace: Item → Report → Detail 3-Panel 구조
 * /workspace/:projectId/:makerId (makerId 없으면 첫 번째 Maker 사용)
 */

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ItemListPanel from "@/components/ItemListPanel";
import ReportDetailPanel from "@/components/ReportDetailPanel";
import ReportListPanel from "@/components/ReportListPanel";
import ItemBulkImport from "@/components/ItemBulkImport";
import ItemCreateDialog from "@/components/ItemCreateDialog";
import ReportUploadForm from "@/components/ReportUploadForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchItem,
  fetchMakersByProject,
  fetchProject,
  fetchReport,
  fetchItemsByMaker,
} from "@/lib/api";
import { ArrowLeft, FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";

export default function Workspace() {
  const params = useParams<{ projectId: string; makerId?: string }>();
  const projectId = params.projectId ?? "";
  const urlMakerId = params.makerId;

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);

  const { user } = useAuth();
  const isMaker = user?.role === "MAKER";

  // makerId 없으면 첫 번째 Maker 사용
  const { data: makers = [] } = useQuery({
    queryKey: ["makers", projectId],
    queryFn: () => fetchMakersByProject(projectId),
    enabled: !!projectId,
  });
  const makerId = urlMakerId ?? makers[0]?.id ?? "";

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items", projectId, makerId],
    queryFn: () => fetchItemsByMaker(projectId, makerId),
    enabled: !!projectId && !!makerId,
  });

  const { data: itemDetail, isLoading: itemLoading } = useQuery({
    queryKey: ["item", selectedItemId],
    queryFn: () => fetchItem(selectedItemId!),
    enabled: !!selectedItemId,
  });

  const { data: reportDetail, isLoading: reportLoading } = useQuery({
    queryKey: ["report", selectedReportId],
    queryFn: () => fetchReport(selectedReportId!),
    enabled: !!selectedReportId,
  });

  const reports = itemDetail?.reports ?? [];

  const makerName = makers.find((m) => m.id === makerId)?.name ?? "";

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

  const ownerName = (project as { owner?: { name: string } }).owner?.name ?? "-";
  // Maker: Back → Maker Dashboard (프로젝트 목록). Owner: Back → Project Detail (Maker별 현황)
  const backHref = isMaker ? "/" : makerId ? `/project/${projectId}` : "/";

  return (
    <Layout
      projectInfo={{
        name: project.name,
        customer: ownerName,
      }}
    >
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-4 shrink-0 bg-card">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
          {makerName && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                Maker: <span className="font-medium text-foreground">{makerName}</span>
              </span>
            </>
          )}
          {isMaker && makerId && (
            <>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setUploadDialogOpen(true)}
              >
                <FileUp size={16} />
                Upload Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setBulkImportOpen(true)}
              >
                <Upload size={16} />
                Bulk Import
              </Button>
            </>
          )}
        </div>

        {/* 3-Panel */}
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 min-h-0"
        >
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full border-r border-border p-2">
              <ItemListPanel
                items={items}
                isLoading={itemsLoading}
                selectedItemId={selectedItemId}
                onSelectItem={(id) => {
                  setSelectedItemId(id);
                  setSelectedReportId(null);
                }}
                onAddItem={isMaker && makerId ? () => setCreateItemOpen(true) : undefined}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full border-r border-border p-2">
              <ReportListPanel
                reports={reports}
                selectedReportId={selectedReportId}
                onSelectReport={setSelectedReportId}
                canCreate={isMaker && !!selectedItemId}
                onNewReport={() => setUploadDialogOpen(true)}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full p-2">
              <ReportDetailPanel
                report={reportDetail ?? null}
                isLoading={!!selectedReportId && reportLoading}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {isMaker && makerId && (
          <>
            <ReportUploadForm
              open={uploadDialogOpen}
              onOpenChange={setUploadDialogOpen}
              projectId={projectId}
              makerId={makerId}
              items={items}
              initialItemId={selectedItemId}
              onSuccess={() => {
                if (selectedItemId) {
                  // item 쿼리 무효화로 리포트 목록 갱신
                }
              }}
            />
            <ItemBulkImport
              open={bulkImportOpen}
              onOpenChange={setBulkImportOpen}
              projectId={projectId}
              makerId={makerId}
            />
            <ItemCreateDialog
              open={createItemOpen}
              onOpenChange={setCreateItemOpen}
              projectId={projectId}
              makerId={makerId}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
