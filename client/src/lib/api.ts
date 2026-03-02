/**
 * X-Hub API 클라이언트
 */

import axios from "axios";
import type { ProjectListItem, ReportListItem } from "@shared/types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// 프로젝트 목록 (대시보드용)
export async function fetchProjects(): Promise<ProjectListItem[]> {
  const { data } = await api.get<ProjectListItem[]>("/projects");
  return data;
}

// 프로젝트 상세 (아이템 목록 포함)
export interface ProjectDetail {
  id: string;
  name: string;
  owner: { name: string };
}

export async function fetchProject(projectId: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${projectId}`);
  return data;
}

// 프로젝트의 리포트 목록
export async function fetchReportsByProject(projectId: string): Promise<ReportListItem[]> {
  const { data } = await api.get<ReportListItem[]>(`/projects/${projectId}/reports`);
  return data;
}

// 리포트 상세 (RT는 rtResultRows 포함)
export interface ReportDetail {
  id: string;
  reportNo: string;
  reportType: string;
  pdfUrl: string;
  issuedDate: string;
  tags: Record<string, string> | null;
  ownerApprovalStatus: string;
  item: { id: string; name: string; number: string };
  rtResultRows: Array<{
    id: string;
    identificationNo: string;
    locationNo: string;
    result: string;
    defect: string | null;
  }>;
}

export async function fetchReport(reportId: string): Promise<ReportDetail> {
  const { data } = await api.get<ReportDetail>(`/reports/${reportId}`);
  return data;
}
