/**
 * X-Hub 공유 타입 정의
 * Prisma 스키마 기반 (2단계) - 프론트엔드/백엔드에서 공통 사용
 */

import type {
  User as PrismaUser,
  Owner as PrismaOwner,
  Maker as PrismaMaker,
  Project as PrismaProject,
  ProjectMaker as PrismaProjectMaker,
  Item as PrismaItem,
  NdtReport as PrismaNdtReport,
  Attachment as PrismaAttachment,
  RtResultRow as PrismaRtResultRow,
  InspectionCompany as PrismaInspectionCompany,
  Role,
  ReportType,
  TestPhase,
  ApprovalStatus,
  AttachmentType,
} from "@prisma/client";

// Re-export Prisma model types
export type User = PrismaUser;
export type Owner = PrismaOwner;
export type Maker = PrismaMaker;
export type Project = PrismaProject;
export type ProjectMaker = PrismaProjectMaker;
export type Item = PrismaItem;
export type NdtReport = PrismaNdtReport;
export type Attachment = PrismaAttachment;
export type RtResultRow = PrismaRtResultRow;
export type InspectionCompany = PrismaInspectionCompany;

// Re-export enums
export type { Role, ReportType, TestPhase, ApprovalStatus, AttachmentType };

// 대시보드용 프로젝트 목록 (계산된 필드 포함)
export interface ProjectListItem {
  id: string;
  name: string;
  customer: string; // owner.name
  procedureCode: string; // placeholder or from tags
  status: "Active" | "Hold" | "Done";
  progress: number;
  pendingCount: number;
  lastUpdated: string;
}

// 워크스페이스용 리포트 목록
export interface ReportListItem {
  id: string;
  projectId: string;
  reportNo: string;
  drawingNo: string;
  itemName: string;
  itemNo: string;
  inspector: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

// ============================================================
// Phase 2-A Day 2 추가 타입
// ============================================================

/** 프로젝트 내 Maker 요약 (ProjectDetail용) */
export interface MakerSummary {
  id: string;
  name: string;
  code: string;
  itemCount: number;
  reportCount: number;
  approvedCount: number;
  pendingCount: number;
}

/** Item 목록 아이템 */
export interface ItemListItem {
  id: string;
  tagNumber: string;
  description: string | null;
  reportCount: number;
  latestReportStatus: string | null;
}

/** Item 상세 (리포트 포함) */
export interface ItemDetail {
  id: string;
  tagNumber: string;
  description: string | null;
  projectMaker: {
    id: string;
    maker: {
      id: string;
      name: string;
      code: string;
    };
  };
  reports: NdtReportListItem[];
}

/** NdtReport 목록 아이템 */
export interface NdtReportListItem {
  id: string;
  reportNumber: string;
  ndtType: string;
  status: string;
  createdAt: string;
  attachmentCount: number;
}
