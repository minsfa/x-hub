/**
 * X-Hub 공유 타입 정의
 * Prisma 스키마 기반 - 프론트엔드/백엔드에서 공통 사용
 */

import type {
  User as PrismaUser,
  Owner as PrismaOwner,
  Maker as PrismaMaker,
  Project as PrismaProject,
  Item as PrismaItem,
  Report as PrismaReport,
  RtResultRow as PrismaRtResultRow,
  InspectionCompany as PrismaInspectionCompany,
  Role,
  ReportType,
  TestPhase,
  ApprovalStatus,
} from "@prisma/client";

// Re-export Prisma model types
export type User = PrismaUser;
export type Owner = PrismaOwner;
export type Maker = PrismaMaker;
export type Project = PrismaProject;
export type Item = PrismaItem;
export type Report = PrismaReport;
export type RtResultRow = PrismaRtResultRow;
export type InspectionCompany = PrismaInspectionCompany;

// Re-export enums
export type { Role, ReportType, TestPhase, ApprovalStatus };

// API 응답용 확장 타입 (relation 포함)
export interface ProjectWithOwner extends Project {
  owner: Owner;
}

export interface ProjectWithItems extends ProjectWithOwner {
  items: Item[];
}

export interface ItemWithReports extends Item {
  reports: Report[];
}

export interface ReportWithRelations extends Report {
  item: Item;
  inspectionCompany: InspectionCompany;
  rtResultRows?: RtResultRow[];
}

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
