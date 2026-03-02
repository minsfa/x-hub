import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProjects } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@shared/types";
import {
  AlertTriangle,
  CheckCircle2,
  Grid3X3,
  List,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

type ViewMode = "card" | "list";
type SortOption = "latest" | "name" | "status";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  // Filter and sort projects
  const filteredProjects = projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.procedureCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          const statusOrder = { Active: 0, Hold: 1, Done: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case "latest":
        default:
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
      }
    });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-destructive">Failed to load projects. Please try again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Total: {projects.length} projects
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search projects..."
                className="pl-9 w-64 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-36 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === "card"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Card View"
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === "card" ? (
          <CardView projects={filteredProjects} />
        ) : (
          <ListView projects={filteredProjects} />
        )}
      </div>
    </Layout>
  );
}

// Card View Component
function CardView({ projects }: { projects: ProjectListItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: ProjectListItem }) {
  const hasPending = project.pendingCount > 0;

  return (
    <Link href={`/workspace/${project.id}`}>
      <div className="panel-beveled overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group">
        {/* Status Color Bar */}
        <div
          className={cn(
            "color-bar",
            project.status === "Active" && "color-bar-active",
            project.status === "Hold" && "color-bar-hold",
            project.status === "Done" && "color-bar-done"
          )}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Customer: {project.customer}
              </p>
            </div>
            <span
              className={cn(
                "status-badge shrink-0",
                project.status === "Active" && "status-active",
                project.status === "Hold" && "status-hold",
                project.status === "Done" && "status-done"
              )}
            >
              {project.status}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-3" />

          {/* Alert Area */}
          <div
            className={cn(
              "rounded-md p-3 mb-3 transition-colors",
              hasPending ? "alert-bg" : "bg-secondary/50"
            )}
          >
            {hasPending ? (
              <div className="flex items-center gap-2">
                <div className="led-indicator led-alert led-pulse" />
                <span className="text-sm font-semibold text-alert">
                  {project.pendingCount} Reports Pending
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-sm text-success">All Reports Approved</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate max-w-[60%]" title={project.procedureCode}>
              {project.procedureCode.split(" ")[0]}
            </span>
            <div className="flex items-center gap-2">
              <div className="progress-bar w-16">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="font-mono-data">{project.progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// List View Component
function ListView({ projects }: { projects: ProjectListItem[] }) {
  return (
    <div className="panel-beveled overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              No.
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Project Name
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Customer
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Procedure / Code
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Progress
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr
              key={project.id}
              className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
            >
              <td className="p-3 text-sm font-mono-data text-muted-foreground">
                {index + 1}
              </td>
              <td className="p-3">
                <span
                  className={cn(
                    "status-badge",
                    project.status === "Active" && "status-active",
                    project.status === "Hold" && "status-hold",
                    project.status === "Done" && "status-done"
                  )}
                >
                  {project.status}
                </span>
              </td>
              <td className="p-3">
                <Link
                  href={`/workspace/${project.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {project.name}
                </Link>
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {project.customer}
              </td>
              <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
                {project.procedureCode}
              </td>
              <td className="p-3">
                {project.pendingCount > 0 ? (
                  <span className="font-mono-data font-bold text-alert flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    {project.pendingCount}
                  </span>
                ) : (
                  <span className="font-mono-data text-muted-foreground">0</span>
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="progress-bar w-16">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="font-mono-data text-sm">
                    {project.progress}%
                  </span>
                </div>
              </td>
              <td className="p-3 text-sm font-mono-data text-muted-foreground">
                {project.lastUpdated}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
