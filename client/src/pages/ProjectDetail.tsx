/**
 * Owner 전용: 프로젝트 내 Maker별 현황
 * Maker 행 클릭 시 Workspace로 이동
 */

import Layout from "@/components/Layout";
import { fetchMakersByProject, fetchProject } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MakerSummary } from "@shared/types";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";

export default function ProjectDetail() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const { data: makers = [], isLoading: makersLoading } = useQuery({
    queryKey: ["makers", projectId],
    queryFn: () => fetchMakersByProject(projectId),
    enabled: !!projectId,
  });

  const isLoading = projectLoading || makersLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (projectError || !project) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-destructive">Failed to load project.</p>
          <Link href="/" className="ml-2 text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const ownerName = (project as { owner?: { name: string } }).owner?.name ?? "-";

  return (
    <Layout
      projectInfo={{
        name: project.name,
        customer: ownerName,
      }}
    >
      <div className="p-6">
        {/* Back + Title */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
              Back
            </button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Owner: {ownerName}</p>
          </div>
        </div>

        {/* Maker별 현황 테이블 */}
        <div className="panel-beveled overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Maker별 현황</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Maker
                </th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reports
                </th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending
                </th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Approved
                </th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  진행률
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {makers.map((maker) => (
                <MakerRow
                  key={maker.id}
                  maker={maker}
                  projectId={projectId}
                />
              ))}
            </tbody>
          </table>
          {makers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No makers assigned to this project.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function MakerRow({
  maker,
  projectId,
}: {
  maker: MakerSummary;
  projectId: string;
}) {
  const progress =
    maker.reportCount > 0
      ? Math.round((maker.approvedCount / maker.reportCount) * 100)
      : 0;

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
      <td className="p-3">
        <span className="font-medium">{maker.name}</span>
      </td>
      <td className="p-3 text-right font-mono-data">{maker.itemCount}</td>
      <td className="p-3 text-right font-mono-data">{maker.reportCount}</td>
      <td className="p-3 text-right">
        {maker.pendingCount > 0 ? (
          <span className="font-mono-data font-semibold text-alert">
            {maker.pendingCount}
          </span>
        ) : (
          <span className="font-mono-data text-muted-foreground">0</span>
        )}
      </td>
      <td className="p-3 text-right font-mono-data text-success">
        {maker.approvedCount}
      </td>
      <td className="p-3">
        <div className="flex items-center justify-end gap-2">
          <div className="progress-bar w-16">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono-data text-sm">{progress}%</span>
        </div>
      </td>
      <td className="p-2">
        <Link href={`/workspace/${projectId}/${maker.id}`}>
          <button
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Open Workspace"
          >
            <ChevronRight size={18} />
          </button>
        </Link>
      </td>
    </tr>
  );
}
