/**
 * X-Hub API 클라이언트
 */

import axios from "axios";
import type {
  ProjectListItem,
  ReportListItem,
  MakerSummary,
  ItemListItem,
  ItemDetail,
} from "@shared/types";

const TOKEN_KEY = "xhub_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Authorization 헤더 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData 전송 시 Content-Type 제거 → 브라우저가 multipart/form-data; boundary=... 자동 설정
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
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

// 리포트 상세 (RT는 rtResultRows 포함, attachments)
export interface ReportDetail {
  id: string;
  reportNo: string;
  reportType: string;
  pdfUrl: string;
  issuedDate: string;
  tags: Record<string, string> | null;
  ownerApprovalStatus: string;
  item: { id: string; name: string; number: string };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
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

/** 리포트 승인/반려 (Owner 전용) */
export async function updateReportApproval(
  reportId: string,
  payload: { status: "APPROVED" | "REJECTED"; comment?: string }
): Promise<ReportDetail> {
  const { data } = await api.patch<ReportDetail>(`/reports/${reportId}/approval`, payload);
  return data;
}

// ============================================================
// Phase 2-A Day 3: Maker / Item API
// ============================================================

/** 프로젝트에 배정된 Maker 목록 + 통계 */
export async function fetchMakersByProject(projectId: string): Promise<MakerSummary[]> {
  const { data } = await api.get<MakerSummary[]>(`/projects/${projectId}/makers`);
  return data;
}

/** 특정 Maker의 Item 목록 */
export async function fetchItemsByMaker(
  projectId: string,
  makerId: string
): Promise<ItemListItem[]> {
  const { data } = await api.get<ItemListItem[]>(
    `/projects/${projectId}/makers/${makerId}/items`
  );
  return data;
}

/** Item 상세 + 리포트 목록 */
export async function fetchItem(itemId: string): Promise<ItemDetail> {
  const { data } = await api.get<ItemDetail>(`/items/${itemId}`);
  return data;
}

/** Item 단건 생성 */
export async function createItem(
  projectId: string,
  makerId: string,
  payload: { number: string; name?: string; drawingNo?: string }
): Promise<ItemListItem> {
  const { data } = await api.post<ItemListItem>(
    `/projects/${projectId}/makers/${makerId}/items`,
    payload
  );
  return data;
}

/** Item 수정 */
export async function updateItem(
  itemId: string,
  payload: { number?: string; name?: string; drawingNo?: string }
): Promise<{ id: string; tagNumber: string; description: string | null }> {
  const { data } = await api.put(`/items/${itemId}`, payload);
  return data;
}

/** Item 엑셀 일괄 등록 */
export async function bulkCreateItems(
  projectId: string,
  makerId: string,
  items: Array<{ number: string; name?: string }>
): Promise<{ created: ItemListItem[]; skipped: string[] }> {
  const { data } = await api.post<{ created: ItemListItem[]; skipped: string[] }>(
    `/projects/${projectId}/makers/${makerId}/items/bulk`,
    { items }
  );
  return data;
}

// ============================================================
// Phase 2-B Day 8: Report Upload
// ============================================================

export interface InspectionCompany {
  id: string;
  name: string;
}

/** 검사기관 목록 */
export async function fetchInspectionCompanies(): Promise<InspectionCompany[]> {
  const { data } = await api.get<InspectionCompany[]>("/inspection-companies");
  return data;
}

/** 리포트 생성 (multipart/form-data) */
export async function createReport(formData: FormData): Promise<ReportDetail> {
  const { data } = await api.post<ReportDetail>("/reports", formData);
  return data;
}

// ============================================================
// Phase 2-B Day 6: Auth API
// ============================================================

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    ownerId: string | null;
    makerId: string | null;
  };
}

/** 로그인 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  ownerId: string | null;
  makerId: string | null;
  ownerName?: string;
  makerName?: string;
}

/** 현재 사용자 정보 (Authorization 헤더 필요) */
export async function fetchMe(token: string): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
